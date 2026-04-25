import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "App",
  description: "Aplicación",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
