'use client';

import { useState } from 'react';
import { useRouter,useSearchParams  } from 'next/navigation';
import { login } from '@/lib/auth.service';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';


export default function LoginPage() {
  const [email, setEmail] = useState('admin@tuapp.com');
  const [password, setPassword] = useState('admin12321');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();

  const rawNext = searchParams.get('next') || '/canchas';

  const next = rawNext.startsWith('/') ? rawNext : '/canchas';


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',                 // <-- importante
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || msg; } catch { }
        throw new Error(msg);
      }
      // Cookie ya seteada por el backend → redirigir
      router.replace(next);
    } catch (e: any) {
      setErr(e?.message ?? 'Error de login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-1">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-6">Accede con tu correo y contraseña</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <div className="relative">
              <input
                className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-black"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-2 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          ¿No tienes cuenta? Contacta a un administrador.
        </p>
      </div>
    </main>
  );
}
