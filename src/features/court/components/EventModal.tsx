'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  start: string;
  end: string;
};

export function EventModal({ isOpen, onClose, onSave, start, end }: Props) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    onSave(title);
    setTitle('');
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              />

              <div className="text-sm text-gray-600">
                <p><strong>Inicio:</strong> {start}</p>
                <p><strong>Fin:</strong> {end}</p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={onClose}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
