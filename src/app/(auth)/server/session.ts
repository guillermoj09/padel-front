// src/server/session.ts (solo HS256)
import { cookies } from 'next/headers';
import * as jose from 'jose';

export type CurrentUser = {
  sub: string;
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
};

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';

async function verifyJwtHS256(token: string): Promise<jose.JWTPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies(); // Next.js moderno: async
  const tok = cookieStore.get(COOKIE_NAME)?.value;
  if (!tok) return null;

  const payload = await verifyJwtHS256(tok);
  if (!payload) return null;

  return {
    sub: String(payload.sub ?? ''),
    email: (payload as any).email,
    name: (payload as any).name,
    username: (payload as any).username,
    roles: ((payload as any).roles as string[]) || [],
  };
}
