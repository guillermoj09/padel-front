'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/features/auth/UserProvider';

export default function TopBar() {
  const pathname = usePathname();
  const user = useUser();
  const [loadingOut, setLoadingOut] = useState(false);

  const isAuthPage = useMemo(() => {
    return pathname === '/login' || pathname.startsWith('/auth/');
  }, [pathname]);

  const name = useMemo(() => {
    if (!user?.email || typeof user.email !== 'string') {
      return 'Usuario';
    }

    const base = user.email.split('@')[0] || 'Usuario';
    return base.charAt(0).toUpperCase() + base.slice(1);
  }, [user?.email]);

  async function handleLogout() {
    if (loadingOut) return;

    setLoadingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.replace('/login');
    } finally {
      setLoadingOut(false);
    }
  }

  if (isAuthPage || !user) return null;

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
        {typeof user.email === 'string' && (
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
