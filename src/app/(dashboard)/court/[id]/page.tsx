// app/(dashboard)/court/[id]/page.tsx
'use client';


import { useParams } from 'next/navigation';
import FullCalendarCourtSchedule from '@/features/court/components/schedule/FullCalendarCourtSchedule';



export default function CourtPage() {
  const { id } = useParams();

  if (!id) return <p>Cargando cancha...</p>;

  return (
    <main>
      <h1>Calendario Cancha {id}</h1>
      <FullCalendarCourtSchedule courtId={id as string} />
    </main>
  );
}
