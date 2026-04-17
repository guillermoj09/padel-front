import { useEffect, useState } from 'react';
import type { AuthMeResponse, AuthUser } from '@/features/auth/types';

export function useSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/session', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!res.ok) {
          if (active) setUser(null);
          return;
        }

        const data = (await res.json()) as AuthMeResponse;
        if (active) {
          setUser(data.user ?? null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
