import { useState } from 'react';
import { getErrorMessage } from '@/lib/errors';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string, next: string) {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let payload: { message?: string } | null = null;
      try {
        payload = (await res.json()) as { message?: string };
      } catch {
        // noop
      }

      if (!res.ok) {
        throw new Error(payload?.message || `Error: ${res.status}`);
      }

      window.location.replace(next || '/canchas');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
