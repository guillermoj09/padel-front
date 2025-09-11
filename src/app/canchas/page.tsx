'use client';


// Importa tu componente exacto (ruta que mencionaste)
import CanchaCalendarRBC from '@/features/court/components/schedule/CanchaCalendarRBC';

export default function CanchasPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Calendario General</h1>
      <CanchaCalendarRBC dataSource="api" />
    </div>
  );
}
