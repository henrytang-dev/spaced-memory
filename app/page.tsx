import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/authSession';

export default function Home() {
  const authed = isAuthenticated();
  redirect(authed ? '/dashboard' : '/auth/login');
}
