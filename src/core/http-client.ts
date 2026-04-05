import { FlutterwaveAPIError, isFlutterwaveErrorPayload } from './errors';
import { TokenManager } from './token-manager';
import { generateIdempotencyKey, generateTraceId } from '../helpers/idempotency';
import type {
  FlutterwaveClientOptions,
  FlutterwaveFailureResponse,
  FlutterwaveRequestOptions,
  HttpMethod,
  RequestQuery,
} from '../types/common';

const ENVIRONMENT_BASE_URLS = {
  sandbox: 'https://developersandbox-api.flutterwave.com',
  production: 'https://f4bexperience.flutterwave.com',
} as const;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function normalizePath(path: string): string {
  return path.replace(/^\//, '');
}

function encodePathValue(value: string | number): string {
  return encodeURIComponent(String(value));
}

function interpolatePath(path: string, params?: Record<string, string | number>): string {
  if (!params) {
    return path;
  }

  return path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing path parameter: ${key}`);
    }

    return encodePathValue(value);
  });
}

function appendQuery(url: URL, query?: RequestQuery): void {
  if (!query) {
    return;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const items = Array.isArray(value) ? value : [value];
    items.forEach((item) => {
      if (item === null || item === undefined) {
        return;
      }

      const normalized = item instanceof Date ? item.toISOString() : String(item);
      url.searchParams.append(key, normalized);
    });
  });
}

function tryParseJson(raw: string): unknown {
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function buildRequestBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === 'string' ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body as BodyInit;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
}

export interface InternalRequestOptions extends FlutterwaveRequestOptions {
  pathParams?: Record<string, string | number>;
  body?: unknown;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultScenarioKey?: string;
  private readonly timeoutMs: number;
  private readonly tokenManager: TokenManager;

  constructor(private readonly options: FlutterwaveClientOptions) {
    const baseUrl =
      options.baseUrl ?? ENVIRONMENT_BASE_URLS[options.environment ?? 'sandbox'];

    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.defaultScenarioKey = options.defaultScenarioKey;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.tokenManager = new TokenManager(options);

    if (!this.fetchImpl) {
      throw new Error('A fetch implementation is required. Use Node.js 18+ or provide options.fetch.');
    }
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    requestOptions: InternalRequestOptions = {},
  ): Promise<T> {
    const url = new URL(interpolatePath(path, requestOptions.pathParams).replace(/^\//, ''), this.baseUrl);
    appendQuery(url, requestOptions.query);

    const headers = new Headers(requestOptions.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${await this.tokenManager.getAccessToken()}`);

    const traceId = requestOptions.traceId ?? generateTraceId();
    headers.set('X-Trace-Id', traceId);

    const scenarioKey = requestOptions.scenarioKey ?? this.defaultScenarioKey;
    if (scenarioKey) {
      headers.set('X-Scenario-Key', scenarioKey);
    }

    if (method === 'POST' && !headers.has('X-Idempotency-Key')) {
      headers.set('X-Idempotency-Key', requestOptions.idempotencyKey ?? generateIdempotencyKey());
    }

    const controller = new AbortController();
    const signal = requestOptions.signal;
    const timeout = setTimeout(() => controller.abort(), requestOptions.timeoutMs ?? this.timeoutMs);

    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason);
      } else {
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
      }
    }

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: buildRequestBody(requestOptions.body, headers),
        signal: controller.signal,
      });

      const raw = await response.text();
      const parsed = tryParseJson(raw);

      if (!response.ok) {
        throw this.createError(response.status, parsed);
      }

      const failure = parsed as FlutterwaveFailureResponse | undefined;
      if (failure?.status === 'failed' && failure.error) {
        throw this.createError(response.status, parsed);
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof FlutterwaveAPIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new FlutterwaveAPIError('Flutterwave request timed out.');
      }

      throw new FlutterwaveAPIError('Flutterwave request failed.', {
        details: error,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private createError(statusCode: number, payload: unknown): FlutterwaveAPIError {
    if (payload && typeof payload === 'object') {
      const typed = payload as FlutterwaveFailureResponse;
      const error = typed.error;

      if (error && isFlutterwaveErrorPayload(error)) {
        return new FlutterwaveAPIError(error.message ?? typed.message ?? 'Flutterwave API request failed.', {
          statusCode,
          type: error.type,
          code: error.code,
          validationErrors: error.validation_errors,
          details: payload,
        });
      }

      if (typeof typed.message === 'string') {
        return new FlutterwaveAPIError(typed.message, {
          statusCode,
          details: payload,
        });
      }
    }

    if (typeof payload === 'string' && payload) {
      return new FlutterwaveAPIError(payload, {
        statusCode,
      });
    }

    return new FlutterwaveAPIError('Flutterwave API request failed.', {
      statusCode,
      details: payload,
    });
  }
}

export function getDefaultBaseUrl(environment: NonNullable<FlutterwaveClientOptions['environment']> = 'sandbox'): string {
  return ENVIRONMENT_BASE_URLS[environment];
}