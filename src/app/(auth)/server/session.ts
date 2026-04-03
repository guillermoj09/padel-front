// src/server/session.ts (solo HS256)
import { cookies } from 'next/headers';
import * as jose from 'jose';
import type { AuthUser } from '@/features/auth/types';

type JwtUserPayload = jose.JWTPayload & {
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
};

export type CurrentUser = AuthUser;

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';

async function verifyJwtHS256(token: string): Promise<JwtUserPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    return payload as JwtUserPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyJwtHS256(token);
  if (!payload) return null;

  return {
    sub: typeof payload.sub === 'string' ? payload.sub : '',
    email: payload.email,
    name: payload.name,
    username: payload.username,
    roles: Array.isArray(payload.roles)
      ? payload.roles.filter(
          (role): role is string => typeof role === 'string' && role.trim().length > 0,
        )
      : [],
  };
}
