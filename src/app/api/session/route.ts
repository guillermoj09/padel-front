import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/(auth)/server/session';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
