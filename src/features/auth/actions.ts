'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/canchas');

  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  // ajusta la clave si tu backend usa otro nombre
  const token = data?.access_token || data?.token || data?.jwt;
  if (!token) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  cookies().set({
    name: AUTH_COOKIE_NAME,
    value: String(token),
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // DEV: false (en prod con HTTPS => true)
    path: '/',
  });

  redirect(next); // refresca RSC + navega
}

export async function logoutAction(next = '/login') {
  try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }); } catch {}
  cookies().delete(AUTH_COOKIE_NAME);
  redirect(next);
}
