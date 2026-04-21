import { randomUUID } from 'node:crypto';

export function generateIdempotencyKey(): string {
  return randomUUID().replace(/-/g, '');
}

export function generateTraceId(): string {
  return randomUUID();
}