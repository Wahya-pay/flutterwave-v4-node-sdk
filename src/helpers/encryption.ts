import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EncryptedPayload } from '../types/common';

function normalizeKey(encryptionKey: string): Buffer {
  const base64 = Buffer.from(encryptionKey, 'base64');
  if (base64.length === 32) {
    return base64;
  }

  const utf8 = Buffer.from(encryptionKey, 'utf8');
  if (utf8.length === 32) {
    return utf8;
  }

  throw new Error('Flutterwave encryption key must resolve to 32 bytes.');
}

/**
 * Generates a random alphanumeric nonce for Flutterwave AES-GCM field encryption.
 *
 * Flutterwave expects a 12-character nonce to be shared across related encrypted
 * card or PIN fields in the same payload.
 */
export function generateNonce(length = 12): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let nonce = '';

  for (let index = 0; index < length; index += 1) {
    nonce += alphabet[bytes[index] % alphabet.length];
  }

  return nonce;
}

/**
 * Encrypts a raw value for Flutterwave field-level encryption.
 *
 * Strings are encrypted as raw strings, while objects are JSON-serialized first.
 * For card and PIN authorization flows, pass raw strings and reuse the same nonce
 * across all encrypted fields in the request.
 *
 * @example
 * ```ts
 * const nonce = generateNonce();
 * const encryptedCardNumber = encryptPayload('5531886652142950', encryptionKey, nonce);
 * const encryptedCvv = encryptPayload('564', encryptionKey, nonce);
 * ```
 */
export function encryptPayload(
  payload: unknown,
  encryptionKey: string,
  nonce = generateNonce(),
): EncryptedPayload {
  if (nonce.length !== 12) {
    throw new Error('Flutterwave nonce must be exactly 12 characters.');
  }

  const key = normalizeKey(encryptionKey);
  const iv = Buffer.from(nonce, 'utf8');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(serializePayload(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: Buffer.concat([ciphertext, authTag]).toString('base64'),
    nonce,
  };
}

/**
 * Decrypts a value previously produced by {@link encryptPayload}.
 *
 * This is mainly useful in tests and local verification utilities. Flutterwave
 * requests normally only require encryption before sending data.
 */
export function decryptPayload<T = unknown>(
  encryptedData: string,
  encryptionKey: string,
  nonce: string,
): T {
  const buffer = Buffer.from(encryptedData, 'base64');
  const key = normalizeKey(encryptionKey);
  const iv = Buffer.from(nonce, 'utf8');
  const ciphertext = buffer.subarray(0, buffer.length - 16);
  const authTag = buffer.subarray(buffer.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

  if (looksLikeStructuredJson(plaintext)) {
    return JSON.parse(plaintext) as T;
  }

  return plaintext as T;
}

function serializePayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if (
    typeof payload === 'number'
    || typeof payload === 'boolean'
    || typeof payload === 'bigint'
  ) {
    return String(payload);
  }

  if (payload instanceof Date) {
    return payload.toISOString();
  }

  if (payload == null) {
    return String(payload);
  }

  return JSON.stringify(payload);
}

function looksLikeStructuredJson(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"');
}