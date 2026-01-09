'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenClient } from '@/lib/auth.service';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getTokenClient();
    if (!token) router.replace('/login');
    else router.replace('/canchas'); // tu dashboard
  }, [router]);

  return null;
}
