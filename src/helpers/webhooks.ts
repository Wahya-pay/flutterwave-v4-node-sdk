import { createHmac, timingSafeEqual } from 'node:crypto';

function toBuffer(value: string | Buffer): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
}

/**
 * Creates the base64-encoded HMAC signature used by Flutterwave webhooks.
 *
 * Pass the raw, unparsed request body so the computed signature matches the value
 * sent by Flutterwave.
 */
export function createWebhookSignature(rawBody: string | Buffer, secretHash: string): string {
  return createHmac('sha256', secretHash).update(toBuffer(rawBody)).digest('base64');
}

/**
 * Verifies a webhook signature against the raw request body.
 *
 * @example
 * ```ts
 * const isValid = verifyWebhookSignature(rawBody, process.env.FLW_WEBHOOK_SECRET!, signature);
 * ```
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  secretHash: string,
  signature: string,
): boolean {
  const expected = Buffer.from(createWebhookSignature(rawBody, secretHash), 'utf8');
  const actual = Buffer.from(signature, 'utf8');

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}