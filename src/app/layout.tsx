// app/layout.tsx
import '../styles/globals.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-calendar/dist/Calendar.css'
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/app/(auth)/server/session';
import { UserProvider } from '@/features/auth/UserProvider';
import TopBar from '@/features/court/components/TopBar'; // ajusta ruta si lo tienes en otra carpeta

export const metadata = { title: 'App', description: 'Aplicación' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser(); // lee cookie en el server
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
