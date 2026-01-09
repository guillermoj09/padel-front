"use client";
import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/features/auth/UserProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3002";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const [loadingOut, setLoadingOut] = useState(false);

  // 🔥 Hook SIEMPRE LLAMADO
  const isAuthPage = useMemo(() => {
    return (
      pathname === "/login" ||
      pathname === "/auth/new-account" ||
      pathname.startsWith("/auth/")
    );
  }, [pathname]);

  // 🔥 Hook SIEMPRE LLAMADO
  const name = useMemo(() => {
    if (!user?.email) return "Usuario";

    const base = user.email.split("@")[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  }, [user?.email]);

  // 🔥 Hook SIEMPRE LLAMADO
  async function handleLogout() {
    setLoadingOut(true);
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.replace("/login");
    } finally {
      setLoadingOut(false);
    }
  }

  // 🔥 EARLY RETURN ÚNICO — DESPUÉS DE TODOS LOS HOOKS
  if (isAuthPage || !user) return null;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "#111827" }}>Hola, {name}</div>

        {!!user?.email && (
          <div style={{ fontSize: 12, color: "#6b7280" }}>{user.email}</div>
        )}
      </div>

      <button
        onClick={handleLogout}
        disabled={loadingOut}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          background: "#111827",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {loadingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    </header>
  );
}
