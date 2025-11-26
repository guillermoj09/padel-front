"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3002";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/admin/booking";
  const next = rawNext.startsWith("/") ? rawNext : "/canchas";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // evita doble submit
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {}
        throw new Error(msg);
      }
      // Cookie ya seteada por el backend → hard reload al destino
      window.location.replace(next);
      return;
    } catch (e: any) {
      setErr(e?.message ?? "Error de login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Marca / logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="size-14 rounded-2xl bg-black text-white grid place-items-center shadow-lg shadow-black/10 dark:shadow-black/40">
            {/* Logo minimal */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="2.4" fill="currentColor" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-zinc-500">Accede con tu correo y contraseña</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-xl">
          <div className="p-6">
            {err && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 6.75h18v10.5H3V6.75Zm.75 0L12 12l8.25-5.25" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-10 py-2.5 outline-none ring-0 focus:border-zinc-400 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm text-zinc-700 dark:text-zinc-300">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6.5 10.5h11v8h-11v-8Zm1.5 0V8a4 4 0 1 1 8 0v2.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-10 py-2.5 pr-12 outline-none ring-0 focus:border-zinc-400 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 dark:text-zinc-400 hover:opacity-80"
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 select-none">
                    <input type="checkbox" className="accent-black" />
                    Recuérdame
                  </label>
                  <a href="#" className="text-xs text-zinc-700 dark:text-zinc-300 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full rounded-xl bg-black text-white py-2.5 font-medium shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loading && (
                    <svg className="animate-spin size-4" viewBox="0 0 24 24" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity=".25"/>
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" opacity=".9"/>
                    </svg>
                  )}
                  {loading ? "Ingresando…" : "Entrar"}
                </span>
              </button>

              {/* Divider social opcional */}
              <div className="relative my-2">
                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 px-2 text-[10px] text-zinc-500">o continuar con</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="rounded-xl border border-zinc-300 dark:border-zinc-700 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Google</button>
                <button type="button" className="rounded-xl border border-zinc-300 dark:border-zinc-700 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Microsoft</button>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          ¿No tienes cuenta? Contacta a un administrador.
        </p>

        <footer className="mt-6 text-center">
          <p className="text-[10px] text-zinc-400">Protegido por autenticación segura • Sesiones HttpOnly</p>
        </footer>
      </div>
    </main>
  );
}
