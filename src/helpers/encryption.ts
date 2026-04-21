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

export function generateNonce(length = 12): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let nonce = '';

  for (let index = 0; index < length; index += 1) {
    nonce += alphabet[bytes[index] % alphabet.length];
  }

  return nonce;
}

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