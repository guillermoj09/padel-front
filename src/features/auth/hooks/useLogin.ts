import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3002";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string, next: string) {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",     // 🔥 recibe cookie HttpOnly del backend
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let msg = `Error: ${res.status}`;
        try {
          msg = (await res.json()).message || msg;
        } catch {}
        throw new Error(msg);
      }

      // Cookie ya seteada → hard reload
      window.location.replace(next);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
