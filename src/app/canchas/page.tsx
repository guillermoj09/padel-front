'use client';


// Importa tu componente exacto (ruta que mencionaste)
import CanchaCalendarRBC from '@/features/court/components/CanchaCalendarRBC';

export default function CanchasPage() {
  return (
    <div className="p-4">
      <CanchaCalendarRBC dataSource="api" />
    </div>
  );
}
