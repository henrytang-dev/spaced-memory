import { redirect } from 'next/navigation';
import NewCardForm from './NewCardForm';
import { isAuthenticated } from '@/lib/authSession';

export default async function NewCardPage() {
  if (!isAuthenticated()) redirect('/auth/login');

  return (
    <div className="mx-auto max-w-3xl">
      <NewCardForm />
    </div>
  );
}
