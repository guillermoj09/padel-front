"use client";

import type { DataSource } from "@/features/court/api/types";
import type { CalendarEvent } from "@/features/court/hooks/useCalendarDay";
import CanchaCalendarRBC from "@/features/court/components/CanchaCalendarRBC";

type Court = { id: string; title: string };

type Props = {
  events?: CalendarEvent[];
  courts?: Court[];
  dataSource?: DataSource;
};

export function AdminReservasScreen({ dataSource }: Props) {
  return (
    <div className="h-[80vh]">
      <CanchaCalendarRBC dataSource={dataSource} />
    </div>
  );
}
