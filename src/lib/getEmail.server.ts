import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';

function b64u(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  return Buffer.from(s + '='.repeat(pad), 'base64').toString('utf8');
}

export async function getEmailFromCookie(): Promise<string | null> {
  const store = await cookies(); // async en Next nuevo
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(b64u(parts[1]));
    return payload?.email ?? null; // ajusta si tu claim se llama distinto
  } catch {
    return null;
  }
}
