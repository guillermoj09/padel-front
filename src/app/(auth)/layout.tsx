
import 'react-big-calendar/lib/css/react-big-calendar.css';


export default function bookingLayout({ children }:
   { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-500">
      {children}
    </main>
  );
}
