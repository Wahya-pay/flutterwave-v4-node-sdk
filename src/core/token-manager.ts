import type { FlutterwaveClientOptions, TokenResponse } from '../types/common';
import { FlutterwaveAPIError } from './errors';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const DEFAULT_AUTH_URL =
  'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

export class TokenManager {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private cachedToken?: CachedToken;
  private pendingToken?: Promise<string>;

  constructor(options: FlutterwaveClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.authUrl = options.authUrl ?? DEFAULT_AUTH_URL;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;

    if (!this.fetchImpl) {
      throw new Error('A fetch implementation is required. Use Node.js 18+ or provide options.fetch.');
    }
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt - 60_000 > now) {
      return this.cachedToken.accessToken;
    }

    if (!this.pendingToken) {
      this.pendingToken = this.refreshAccessToken().finally(() => {
        this.pendingToken = undefined;
      });
    }

    return this.pendingToken;
  }

  private async refreshAccessToken(): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await this.fetchImpl(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
        signal: controller.signal,
      });

      const raw = await response.text();
      const parsed = raw ? (JSON.parse(raw) as Partial<TokenResponse>) : undefined;

      if (!response.ok || !parsed?.access_token || !parsed?.expires_in) {
        throw new FlutterwaveAPIError('Failed to fetch Flutterwave access token.', {
          statusCode: response.status,
          details: parsed ?? raw,
        });
      }

      const expiresAt = Date.now() + parsed.expires_in * 1000;
      this.cachedToken = {
        accessToken: parsed.access_token,
        expiresAt,
      };

      return parsed.access_token;
    } catch (error) {
      if (error instanceof FlutterwaveAPIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new FlutterwaveAPIError('Timed out while fetching Flutterwave access token.');
      }

      throw new FlutterwaveAPIError('Unable to fetch Flutterwave access token.', {
        details: error,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}