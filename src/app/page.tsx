import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'access_token';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    redirect('/canchas');
  }

  redirect('/login');
}
