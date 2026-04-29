'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

export type EventModalPayload = {
  title: string;
  start: string;
  end: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: EventModalPayload) => Promise<void> | void;
  start: string;
  end: string;
};

function formatDateForView(value: string): string {
  if (!value) return 'Fecha no disponible';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function EventModal({ isOpen, onClose, onSave, start, end }: Props) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Debes ingresar un título para el evento.');
      return;
    }

    if (!start || !end) {
      setError('La fecha de inicio o término no es válida.');
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('La fecha seleccionada no tiene un formato válido.');
      return;
    }

    if (endDate <= startDate) {
      setError('La fecha de término debe ser posterior a la fecha de inicio.');
      return;
    }

    try {
      setIsSaving(true);

      await onSave({
        title: cleanTitle,
        start,
        end,
      });

      setTitle('');
      onClose();
    } catch (err) {
      console.error('Error al guardar evento:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar el evento.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;

    setTitle('');
    setError(null);
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-xl">
            <Dialog.Title className="text-lg font-bold mb-4">
              Crear Evento
            </Dialog.Title>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título del evento"
                className="w-full border p-2 rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
              />

              <div className="text-sm text-gray-600">
                <p>
                  <strong>Inicio:</strong> {formatDateForView(start)}
                </p>
                <p>
                  <strong>Fin:</strong> {formatDateForView(end)}
                </p>
              </div>

              {error && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
