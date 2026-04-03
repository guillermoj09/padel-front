'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { getErrorMessage } from '@/lib/errors';

type Resource = { id: string; title: string };

type Props = {
  isOpen: boolean;
  resources: Resource[];
  defaultCourtId?: string;
  defaultStart?: Date;
  defaultEnd?: Date;
  onClose: () => void;
  onSave: (data: {
    title: string;
    courtId: string;
    start: Date;
    end: Date;
    notes?: string;
  }) => Promise<void> | void;
};

export function ReserveModal({
  isOpen,
  resources,
  defaultCourtId,
  defaultStart,
  defaultEnd,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState('');
  const [courtId, setCourtId] = useState(defaultCourtId ?? resources[0]?.id ?? '');
  const [start, setStart] = useState<Date | undefined>(defaultStart);
  const [end, setEnd] = useState<Date | undefined>(defaultEnd);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let element = document.getElementById('modal-root') as HTMLElement | null;
    if (!element) {
      element = document.createElement('div');
      element.id = 'modal-root';
      document.body.appendChild(element);
    }

    setContainer(element);
  }, []);

  useEffect(() => {
    setTitle('');
    setNotes('');
    setError('');
    setCourtId(defaultCourtId ?? resources[0]?.id ?? '');
    setStart(defaultStart);
    setEnd(defaultEnd);
  }, [isOpen, defaultCourtId, defaultStart, defaultEnd, resources]);

  const validate = () => {
    if (!resources.length) return 'No hay canchas disponibles.';
    if (!courtId) return 'Selecciona una cancha.';
    if (!start || !end) return 'Selecciona un rango horario.';
    if (end <= start) return 'La hora de fin debe ser mayor a la de inicio.';
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim() || 'Reserva',
        courtId,
        start: start as Date,
        end: end as Date,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error: unknown) {
      console.error('Error creando reserva', error);
      setError(getErrorMessage(error, 'No se pudo crear la reserva.'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !container) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/30"
        onClick={!saving ? onClose : undefined}
      />

      <div className="relative z-[1001] w-[420px] rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold">Nueva reserva</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!resources.length && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              No hay canchas disponibles. Cierra y selecciona alguna cancha en la lista.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Título</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Reserva entrenamiento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Cancha</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              disabled={saving || !resources.length}
            >
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Inicio</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={start ? toLocalInputValue(start) : ''}
                onChange={(e) => setStart(fromLocalInputValue(e.target.value))}
                disabled={saving}
              />
              {start && <p className="text-[11px] text-gray-500">({format(start, 'dd/MM HH:mm')})</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fin</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={end ? toLocalInputValue(end) : ''}
                onChange={(e) => setEnd(fromLocalInputValue(e.target.value))}
                disabled={saving}
              />
              {end && <p className="text-[11px] text-gray-500">({format(end, 'dd/MM HH:mm')})</p>}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !resources.length}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>,
    container,
  );
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInputValue(value: string) {
  return value ? new Date(value) : undefined;
}
