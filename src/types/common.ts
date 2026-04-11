/** Supported Flutterwave API environments. */
export type FlutterwaveEnvironment = 'sandbox' | 'production';

/** Supported HTTP verbs used by generated endpoint metadata. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type PrimitiveQueryValue = string | number | boolean | null | undefined | Date;

export type QueryValue = PrimitiveQueryValue | PrimitiveQueryValue[];

/** Generic query-string object accepted by list and filter endpoints. */
export interface RequestQuery {
  [key: string]: QueryValue;
}

/**
 * Per-request overrides for any SDK call.
 *
 * Use this for advanced cases such as supplying a custom `X-Trace-Id`, forcing a
 * sandbox `scenarioKey`, or overriding request timeout behavior for a single call.
 */
export interface FlutterwaveRequestOptions {
  /** Additional headers merged into the generated request. */
  headers?: HeadersInit;

  /** Extra query parameters appended to the request URL. */
  query?: RequestQuery;

  /** Explicit idempotency key for POST requests when you need deterministic retries. */
  idempotencyKey?: string;

  /** Explicit trace ID for correlating requests in logs and support workflows. */
  traceId?: string;

  /** Sandbox scenario key used to control mocked flows such as card authorization paths. */
  scenarioKey?: string;

  /** Abort signal forwarded to the underlying fetch call. */
  signal?: AbortSignal;

  /** Per-request timeout override in milliseconds. */
  timeoutMs?: number;
}

/**
 * Options used when creating a {@link FlutterwaveClient}.
 */
export interface FlutterwaveClientOptions {
  /** Flutterwave OAuth client ID. */
  clientId: string;

  /** Flutterwave OAuth client secret. */
  clientSecret: string;

  /** Target environment. Defaults to `sandbox`. */
  environment?: FlutterwaveEnvironment;

  /** Override for the API base URL. Mostly useful for tests or proxies. */
  baseUrl?: string;

  /** Override for the OAuth token URL. Mostly useful for tests or proxies. */
  authUrl?: string;

  /** Default request timeout in milliseconds. */
  timeoutMs?: number;

  /** Default sandbox scenario key applied to every request unless overridden per call. */
  defaultScenarioKey?: string;

  /** Custom fetch implementation for controlled runtimes or tests. */
  fetch?: typeof fetch;
}

/** OAuth token payload returned from Flutterwave authentication. */
export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

/** Structured error metadata returned by Flutterwave on failed requests. */
export interface FlutterwaveErrorPayload {
  type?: string;
  code?: string;
  message?: string;
  validation_errors?: unknown;
}

/** Error envelope returned by Flutterwave when `status` is `failed`. */
export interface FlutterwaveFailureResponse {
  status: 'failed';
  message?: string;
  error: FlutterwaveErrorPayload;
  meta?: Record<string, unknown>;
}

/** Generated endpoint metadata exported for tooling and introspection. */
export interface EndpointDefinition {
  slug: string;
  method: HttpMethod;
  path: string;
  title: string;
}

/**
 * Result of encrypting a value for Flutterwave card or PIN authorization flows.
 */
export interface EncryptedPayload {
  /** Base64-encoded AES-GCM ciphertext including the auth tag. */
  encryptedData: string;

  /** Shared 12-character nonce used for Flutterwave field-level encryption. */
  nonce: string;
}