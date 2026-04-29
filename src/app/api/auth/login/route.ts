import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { AuthLoginResponse } from '@/features/auth/types';

export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  if (!API_BASE) {
    return NextResponse.json(
      { message: 'Falta NEXT_PUBLIC_API_BASE en el entorno' },
      { status: 500 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Body inválido' }, { status: 400 });
  }

  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Correo y contraseña son obligatorios' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar con la API de autenticación' },
      { status: 502 },
    );
  }

  let data: AuthLoginResponse | { message?: string } | null = null;
  try {
    data = (await upstream.json()) as AuthLoginResponse | { message?: string };
  } catch {
    // la API respondió sin JSON válido
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message || 'Credenciales inválidas' },
      { status: upstream.status },
    );
  }
  
  const accessToken =
    data && 'access_token' in data && typeof data.access_token === 'string'
      ? data.access_token
      : null;

  if (!accessToken) {
    return NextResponse.json(
      { message: 'La API no devolvió access_token' },
      { status: 502 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
