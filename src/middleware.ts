// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = [/^\/canchas(\/|$)/, /^\/court(\/|$)/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((re) => re.test(pathname));
  if (!needsAuth) return NextResponse.next();

  // El middleware solo ve COOKIES, no localStorage
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login'; // o '/login' si cambiaste la ruta
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/canchas/:path*', '/court/:path*'], // añade otras zonas privadas si quieres
};
