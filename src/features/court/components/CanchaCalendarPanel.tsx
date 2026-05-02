"use client";

import dynamic from "next/dynamic";
import type { CanchaCalendarRBCProps } from "./CanchaCalendarRBC";

const CanchaCalendarRBC = dynamic<CanchaCalendarRBCProps>(
  () => import("./CanchaCalendarRBC"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Cargando calendario...
      </div>
    ),
  },
);

export default function CanchaCalendarPanel(props: CanchaCalendarRBCProps) {
  return <CanchaCalendarRBC {...props} />;
}
