'use client';

import Calendar from 'react-calendar';
import { isFutbolType, isPadelType } from '@/features/court/utils/courtTypes';

type CourtResource = {
  id: string | number;
  title: string;
  type?: string | null;
};

type Props = {
  date: Date;
  minDate: Date;
  courts: CourtResource[];
  selected: string[];
  onDateChange: (date: Date) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleCourt: (courtId: string) => void;
};

export function CourtCalendarSidebar({
  date,
  minDate,
  courts,
  selected,
  onDateChange,
  onSelectAll,
  onClearSelection,
  onToggleCourt,
}: Props) {
  const padelCourts = courts.filter((court) => isPadelType(court.type));
  const futbolCourts = courts.filter((court) => isFutbolType(court.type));
  const otherCourts = courts.filter(
    (court) => !isPadelType(court.type) && !isFutbolType(court.type)
  );

  const renderCourtGroup = (title: string, items: CourtResource[]) => {
    if (!items.length) return null;

    return (
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-2">
          {title}
        </p>

        <div className="flex flex-col gap-1">
          {items.map((court) => {
            const id = String(court.id);

            return (
              <label
                key={id}
                className="flex items-center gap-1 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={() => onToggleCourt(id)}
                />
                <span>{court.title}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="h-full flex flex-col gap-3">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2">
        <Calendar
          locale="es"
          calendarType="iso8601"
          value={date}
          onChange={(value) => {
            const picked = Array.isArray(value) ? value[0] : value;
            if (!(picked instanceof Date)) return;

            onDateChange(picked < minDate ? minDate : picked);
          }}
          next2Label={null}
          prev2Label={null}
          minDate={minDate}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3 flex-1 flex flex-col gap-3">
        <span className="text-xs font-medium text-zinc-700">
          Canchas visibles
        </span>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onSelectAll}
            className="px-2 py-1 text-xs border rounded bg-zinc-50"
          >
            Todas
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="px-2 py-1 text-xs border rounded bg-zinc-50"
          >
            Ninguna
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col gap-4">
          {renderCourtGroup('Pádel', padelCourts)}
          {renderCourtGroup('Fútbol', futbolCourts)}
          {renderCourtGroup('Otras', otherCourts)}
        </div>
      </div>
    </aside>
  );
}
