import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const store = await cookies();
  return NextResponse.json({
    access_token: store.get(process.env.AUTH_COOKIE_NAME || 'access_token')?.value ?? null,
  });
}