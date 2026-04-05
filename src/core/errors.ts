import type { FlutterwaveErrorPayload } from '../types/common';

export interface FlutterwaveAPIErrorOptions {
  statusCode?: number;
  type?: string;
  code?: string;
  validationErrors?: unknown;
  details?: unknown;
}

export class FlutterwaveAPIError extends Error {
  readonly statusCode?: number;
  readonly type?: string;
  readonly code?: string;
  readonly validationErrors?: unknown;
  readonly details?: unknown;

  constructor(message: string, options: FlutterwaveAPIErrorOptions = {}) {
    super(message);
    this.name = 'FlutterwaveAPIError';
    this.statusCode = options.statusCode;
    this.type = options.type;
    this.code = options.code;
    this.validationErrors = options.validationErrors;
    this.details = options.details;
  }
}

export function isFlutterwaveErrorPayload(value: unknown): value is FlutterwaveErrorPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.message === 'string' ||
    typeof candidate.code === 'string' ||
    typeof candidate.type === 'string' ||
    'validation_errors' in candidate
  );
}