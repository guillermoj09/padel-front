"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLogin } from "@/features/auth/hooks/useLogin";

export default function LoginPage() {
  const search = useSearchParams();
  const next = search.get("next") || "/admin/booking";

  const { login, loading, error } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    login(email, password, next); // 🔥 ahora login va por el hook
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-xs bg-white px-6 py-8 shadow rounded">

        <h1 className="text-xl font-semibold text-center mb-4">
          Iniciar sesión
        </h1>

        {error && (
          <p className="text-red-600 text-center text-sm mb-3">{error}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">

          <div>
            <label className="text-sm text-zinc-600">Correo</label>
            <input
              type="email"
              className="mt-1 w-full border px-3 py-2 rounded"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-zinc-600">Contraseña</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="mt-1 w-full border px-3 py-2 rounded"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="absolute right-3 top-3 text-xs text-zinc-500 cursor-pointer"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? "ocultar" : "ver"}
              </span>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          ¿No tienes cuenta? Contacta a un administrador.
        </p>

        <footer className="mt-6 text-center">
          <p className="text-[10px] text-zinc-400">
            Protegido por autenticación segura • Sesiones HttpOnly
          </p>
        </footer>
      </div>
    </main>
  );
}
