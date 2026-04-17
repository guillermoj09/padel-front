import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';

export async function POST() {
  if (API_BASE) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        cache: 'no-store',
      });
    } catch {
      // noop
    }
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
