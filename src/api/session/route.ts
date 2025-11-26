import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'; // ← MUY IMPORTANTE (evita Edge)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Llama a tu backend (devuelve cookie access_token)
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'manual',      // no sigas 3xx del backend
    cache: 'no-store',
  });

  // replica el cuerpo tal cual (sin parsear) para no perder headers
  const buf = await res.arrayBuffer();
  const out = new NextResponse(buf, { status: res.status });

  // COPIA Set-Cookie tal cual
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    // usa append por si en el futuro hay varias cookies
    out.headers.append('set-cookie', setCookie);
  }

  // Content-Type
  const ct = res.headers.get('content-type') || 'application/json; charset=utf-8';
  out.headers.set('content-type', ct);

  // header de depuración
  if (process.env.NODE_ENV !== 'production') {
    out.headers.set('x-proxy-login', `status=${res.status}; hasSetCookie=${Boolean(setCookie)}`);
  }

  return out;
}
