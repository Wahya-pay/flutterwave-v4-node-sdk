import { describe, expect, it } from 'vitest';
import {
  createWebhookSignature,
  decryptPayload,
  encryptPayload,
  generateIdempotencyKey,
  verifyWebhookSignature,
} from '../src';

describe('helpers', () => {
  it('generates alphanumeric idempotency keys', () => {
    const key = generateIdempotencyKey();
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
    expect(key.length).toBeGreaterThanOrEqual(12);
  });

  it('encrypts and decrypts payloads with AES-GCM', () => {
    const key = Buffer.alloc(32, 1).toString('base64');
    const payload = { card_number: '5531886652142950', cvv: '564' };
    const encrypted = encryptPayload(payload, key, '123456789012');

    expect(encrypted.nonce).toBe('123456789012');
    expect(encrypted.encryptedData).not.toContain(payload.card_number);
    expect(decryptPayload<typeof payload>(encrypted.encryptedData, key, encrypted.nonce)).toEqual(payload);
  });

  it('encrypts raw string values for card fields', () => {
    const key = Buffer.alloc(32, 1).toString('base64');
    const payload = '5531886652142950';
    const encrypted = encryptPayload(payload, key, '123456789012');

    expect(encrypted.nonce).toBe('123456789012');
    expect(encrypted.encryptedData).not.toContain(payload);
    expect(decryptPayload<string>(encrypted.encryptedData, key, encrypted.nonce)).toBe(payload);
  });

  it('verifies webhook signatures against the raw body', () => {
    const rawBody = JSON.stringify({ event: 'charge.completed', id: 'evt_123' });
    const secret = 'secret-hash';
    const signature = createWebhookSignature(rawBody, secret);

    expect(verifyWebhookSignature(rawBody, secret, signature)).toBe(true);
    expect(verifyWebhookSignature(rawBody, secret, 'invalid')).toBe(false);
  });
});