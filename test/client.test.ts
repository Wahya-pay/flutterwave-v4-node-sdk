import { describe, expect, it, vi } from 'vitest';
import { FlutterwaveClient } from '../src/client';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
}

describe('FlutterwaveClient', () => {
  it('adds auth, trace, and idempotency headers for POST requests', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token-123', expires_in: 600 }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: 'cust_123' } }));

    const client = new FlutterwaveClient({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: fetchMock,
    });

    await client.customers.create({ email: 'ada@example.com' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, request] = fetchMock.mock.calls[1];
    const headers = request?.headers as HeadersInit;
    const normalized = new Headers(headers);

    expect(request?.method).toBe('POST');
    expect(normalized.get('Authorization')).toBe('Bearer token-123');
    expect(normalized.get('X-Idempotency-Key')).toBeTruthy();
    expect(normalized.get('X-Trace-Id')).toBeTruthy();
  });

  it('uses DELETE for transfer recipient deletion', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token-123', expires_in: 600 }))
      .mockResolvedValueOnce(jsonResponse({ status: 'success' }));

    const client = new FlutterwaveClient({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: fetchMock,
    });

    await client.transferRecipients.delete('recipient_123');

    const [url, request] = fetchMock.mock.calls[1];
    expect(String(url)).toContain('/transfers/recipients/recipient_123');
    expect(request?.method).toBe('DELETE');
  });
});