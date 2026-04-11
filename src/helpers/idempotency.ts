import { randomUUID } from 'node:crypto';

/**
 * Generates an idempotency key suitable for Flutterwave POST requests.
 */
export function generateIdempotencyKey(): string {
  return randomUUID().replace(/-/g, '');
}

/**
 * Generates a trace ID that can be attached to SDK requests for log correlation.
 */
export function generateTraceId(): string {
  return randomUUID();
}