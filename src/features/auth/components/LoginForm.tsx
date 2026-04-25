"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLogin } from "@/features/auth/hooks/useLogin";

export default function LoginForm() {
  const search = useSearchParams();
  const next = search.get("next") || "/canchas";

  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password, next);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-xs rounded bg-white px-6 py-8 shadow">
        <h1 className="mb-4 text-center text-xl font-semibold">Iniciar sesión</h1>

        {error && <p className="mb-3 text-center text-sm text-red-600">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-600">Correo</label>
            <input
              type="email"
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-zinc-600">Contraseña</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="absolute right-3 top-3 text-xs text-zinc-500"
                onClick={() => setShowPwd((current) => !current)}
              >
                {showPwd ? "ocultar" : "ver"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          ¿No tienes cuenta? Contacta a un administrador.
        </p>
      </div>
    </main>
  );
}
