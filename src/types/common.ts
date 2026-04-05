export type FlutterwaveEnvironment = 'sandbox' | 'production';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type PrimitiveQueryValue = string | number | boolean | null | undefined | Date;

export type QueryValue = PrimitiveQueryValue | PrimitiveQueryValue[];

export interface RequestQuery {
  [key: string]: QueryValue;
}

export interface FlutterwaveRequestOptions {
  headers?: HeadersInit;
  query?: RequestQuery;
  idempotencyKey?: string;
  traceId?: string;
  scenarioKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface FlutterwaveClientOptions {
  clientId: string;
  clientSecret: string;
  environment?: FlutterwaveEnvironment;
  baseUrl?: string;
  authUrl?: string;
  timeoutMs?: number;
  defaultScenarioKey?: string;
  fetch?: typeof fetch;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

export interface FlutterwaveErrorPayload {
  type?: string;
  code?: string;
  message?: string;
  validation_errors?: unknown;
}

export interface FlutterwaveFailureResponse {
  status: 'failed';
  message?: string;
  error: FlutterwaveErrorPayload;
  meta?: Record<string, unknown>;
}

export interface EndpointDefinition {
  slug: string;
  method: HttpMethod;
  path: string;
  title: string;
}

export interface EncryptedPayload {
  encryptedData: string;
  nonce: string;
}