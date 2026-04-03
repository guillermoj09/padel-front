// src/lib/api.ts
import { isRecord } from '@/lib/errors';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';

type JsonBody = Record<string, unknown>;
type ApiInit = RequestInit & { jsonBody?: JsonBody | null; noStore?: boolean };

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const detail = payload.message ?? payload.error;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const normalized = detail
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join(', ');

    return normalized || null;
  }

  return null;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: ApiInit = {},
): Promise<T> {
  const { headers, jsonBody, noStore, ...rest } = init;
  const requestHeaders = new Headers(headers || {});

  if (jsonBody && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    method: rest.method ?? (jsonBody ? 'POST' : 'GET'),
    headers: requestHeaders,
    credentials: 'include',
    cache: noStore ? 'no-store' : (rest.cache ?? 'no-store'),
    body: jsonBody ? JSON.stringify(jsonBody) : rest.body,
  });

  if (res.status === 204) {
    return null as T;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let payload: unknown = null;

    try {
      payload = isJson ? await res.json() : await res.text();
      message = getPayloadMessage(payload) || message;
    } catch {
      // noop
    }

    throw new ApiError(res.status, message, payload);
  }

  return (isJson ? await res.json() : await res.text()) as T;
}
