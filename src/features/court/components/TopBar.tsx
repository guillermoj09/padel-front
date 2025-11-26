// src/features/court/components/TopBar.tsx
'use client';
import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/features/auth/UserProvider';
import { apiFetch } from '@/lib/api';

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const [loadingOut, setLoadingOut] = useState(false);

  // 👇 Hook SIEMPRE llamado
  const isAuthPage = useMemo(
    () => pathname === '/login' || pathname === '/new-account',
    [pathname]
  );

  // 👇 Hook SIEMPRE llamado (aunque estés en /login)
  const name = useMemo(() => {
    const base =
      (user?.name?.trim()) ||
      user?.username ||
      (user?.email ? user.email.split('@')[0] : '') ||
      'Usuario';
    return base.charAt(0).toUpperCase() + base.slice(1);
  }, [user?.name, user?.username, user?.email]);

  async function handleLogout() {
    try {
      setLoadingOut(true);
      try { await apiFetch('/auth/logout', { method: 'POST', noStore: true }); } catch {}
      router.replace('/login');
      router.refresh();
    } finally {
      setLoadingOut(false);
    }
  }

  // 👇 Recién acá retornas condicionalmente (después de que TODOS los hooks se llamaron)
  if (isAuthPage) return null;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#111827' }}>Hola, {name}</div>
        {!!user?.email && (
          <div style={{ fontSize: 12, color: '#6b7280' }}>{user.email}</div>
        )}
      </div>
      <button
        onClick={handleLogout}
        disabled={loadingOut}
        style={{
          padding: '8px 12px',
          borderRadius: 10,
          background: '#111827',
          color: '#fff',
          fontWeight: 600,
        }}
      >
        {loadingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </header>
  );
}
