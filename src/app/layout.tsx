// app/layout.tsx
import '../styles/globals.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-calendar/dist/Calendar.css';
import type { ReactNode } from 'react';
import { UserProvider } from '@/features/auth/UserProvider';
import TopBar from '@/features/court/components/TopBar';

export const metadata = { title: 'App', description: 'Aplicación' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          <TopBar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
