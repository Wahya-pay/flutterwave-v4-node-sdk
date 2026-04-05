import { HttpClient } from '../core/http-client';
import type { FlutterwaveRequestOptions, RequestQuery } from '../types/common';

export class BaseResource {
  constructor(protected readonly http: HttpClient) {}

  protected requestGet<T>(path: string, query?: RequestQuery, options: FlutterwaveRequestOptions = {}): Promise<T> {
    return this.http.request<T>('GET', path, { ...options, query });
  }

  protected requestPost<T>(path: string, body?: unknown, options: FlutterwaveRequestOptions = {}): Promise<T> {
    return this.http.request<T>('POST', path, { ...options, body });
  }

  protected requestPut<T>(path: string, body?: unknown, options: FlutterwaveRequestOptions = {}): Promise<T> {
    return this.http.request<T>('PUT', path, { ...options, body });
  }

  protected requestDelete<T>(path: string, options: FlutterwaveRequestOptions = {}): Promise<T> {
    return this.http.request<T>('DELETE', path, options);
  }
}