// src/lib/auth.service.ts
import { apiFetch } from '@/lib/api';

type LoginResp = { access_token?: string; token?: string; jwt?: string };

// --- almacenamiento del JWT en cliente ---
const STORAGE_KEY = 'auth:token';

function setToken(token: string | null) {
  if (typeof window === 'undefined') return; // evitar SSR
  if (!token) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, token);
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

function decodeJwt<T = any>(): T | null {
  try {
    const t = getToken();
    if (!t) return null;
    const [, payload] = t.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// --- API pública ---
export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResp>('/auth/login', {
    method: 'POST',
    // usa jsonBody para que apiFetch ponga Content-Type y haga POST
    jsonBody: { email, password },
    noStore: true,
  });

  const token = data.access_token ?? data.token ?? data.jwt ?? null;
  setToken(token);
  return token;
}

export function logout() {
  setToken(null);
}

export function getSession<T = { sub?: string; email?: string; type?: string }>() {
  return decodeJwt<T>();
}

// Export opcional si prefieres el mismo shape que antes
export const auth = {
  set: setToken,
  get: getToken,
  decode: decodeJwt,
};
