import { apiFetch, auth } from '@/lib/api';

type LoginResp = { access_token?: string; token?: string; jwt?: string };

export async function login(email: string, password: string) {
  console.log(`entro`);
  const data = await apiFetch<LoginResp>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  const token = data.access_token ?? data.token ?? data.jwt;
  if (!token) throw new Error('Token no presente en la respuesta');
  auth.set(token);
  return token;
}

export function logout() { auth.set(null); }
export const getSession = () => auth.decode<{ sub?: string; email?: string; type?: string }>();
