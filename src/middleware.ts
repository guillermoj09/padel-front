import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';
const PROTECTED = [
  /^\/canchas(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/schedule(\/|$)/,
  /^\/court(\/|$)/,
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const needsAuth = PROTECTED.some((re) => re.test(pathname));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/canchas/:path*', '/admin/:path*', '/schedule/:path*', '/court/:path*'],
};
