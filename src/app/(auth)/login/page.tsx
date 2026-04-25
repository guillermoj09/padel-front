import { Suspense } from "react";
import LoginForm from "@/features/auth/components/LoginForm";

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-xs rounded bg-white px-6 py-8 shadow">
        <h1 className="mb-4 text-center text-xl font-semibold">Iniciar sesión</h1>
        <p className="text-center text-sm text-zinc-500">Cargando...</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}
