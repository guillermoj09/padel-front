// src/components/ErrorModal.tsx
'use client';

type Props = {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ isOpen, title = "No se pudo crear la reserva", message, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* panel */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{message}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-lg px-4 py-2 bg-gray-200"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
