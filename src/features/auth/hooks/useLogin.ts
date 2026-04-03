import { useState } from 'react';
import { getErrorMessage } from '@/lib/errors';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string, next: string) {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let msg = `Error: ${res.status}`;
        try {
          const payload = (await res.json()) as { message?: string };
          msg = payload.message || msg;
        } catch {
          // noop
        }
        throw new Error(msg);
      }

      window.location.replace(next);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
