// app/layout.tsx
import '../styles/globals.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-calendar/dist/Calendar.css'


export const metadata = {
  title: 'Test Modal',
  description: 'Prueba de modal visible',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
