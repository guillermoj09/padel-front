'use client';


import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center text-white px-4"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1623428457092-0f7b39c7019a?auto=format&fit=crop&w=1950&q=80')`,
      }}
    >
      <div className="bg-black bg-opacity-60 p-8 rounded-xl text-center max-w-xl">
        <h1 className="text-4xl font-bold mb-4">Bienvenido al Agendador de Canchas de Pádel</h1>
        <p className="text-lg mb-6">Elige una cancha para ver su calendario y reservar horarios.</p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/court/1"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Ver Cancha Padel 1
          </Link>
          <Link
            href="/court/2"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Ver Cancha Padel 2
          </Link>
          <Link
            href="/court/3"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Ver Cancha Padel 3
          </Link>
        </div>
      </div>
    </main>
  );
}
