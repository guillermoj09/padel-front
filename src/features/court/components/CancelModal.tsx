'use client';

import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title?: string;
  loading?: boolean;
};

export function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Cancelar reserva',
  loading = false,
}: Props) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal
    >
      <div className="bg-white rounded-xl shadow-xl w-[360px] max-w-[95vw] p-5 space-y-4">
        <div className="text-lg font-semibold">{title}</div>
        <p className="text-sm text-gray-600">
          ¿Seguro que quieres cancelar esta reserva? Esta acción no se puede
          deshacer.
        </p>

        <label className="text-xs text-gray-500 block">
          Motivo (opcional)
          <textarea
            className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg border"
          >
            Cerrar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white disabled:opacity-70"
          >
            {loading ? 'Cancelando…' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}
