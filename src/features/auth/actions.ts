'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthLoginResponse } from '@/features/auth/types';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3002';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/admin/booking');

  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let data: AuthLoginResponse | null = null;
  try {
    data = (await resp.json()) as AuthLoginResponse;
  } catch {
    return { error: true, msg: 'Error del servidor' };
  }

  if (!resp.ok) {
    return { error: true, msg: data?.message || 'Credenciales inválidas' };
  }

  if (!data?.access_token) {
    return { error: true, msg: 'La API no devolvió access_token' };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: data.access_token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect(next);
}

export async function logoutAction(next = '/login') {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch {
    // noop
  }

  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect(next);
}
