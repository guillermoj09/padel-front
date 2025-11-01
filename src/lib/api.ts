// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';

type ApiInit = RequestInit & { jsonBody?: Record<string, any> | null; noStore?: boolean };

export async function apiFetch<T = any>(path: string, init: ApiInit = {}): Promise<T> {
  const { headers, jsonBody, noStore, ...rest } = init;
  const h = new Headers(headers || {});
  if (jsonBody && !h.has('Content-Type')) h.set('Content-Type', 'application/json');

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    method: rest.method ?? (jsonBody ? 'POST' : 'GET'),
    headers: h,
    credentials: 'include',                     // << envía/recibe cookie httpOnly
    cache: noStore ? 'no-store' : (rest.cache ?? 'no-store'),
    body: jsonBody ? JSON.stringify(jsonBody) : rest.body,
  });

  if (res.status === 204) return null as T;

  const ctype = res.headers.get('content-type') || '';
  const isJson = ctype.includes('application/json');

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const payload = isJson ? await res.json() : await res.text();
      const detail = typeof payload === 'string' ? payload : (payload?.message || payload?.error);
      if (detail) msg = Array.isArray(detail) ? detail.join(', ') : String(detail);
    } catch {}
    throw new Error(msg);
  }

  return (isJson ? await res.json() : await res.text()) as T;
}
