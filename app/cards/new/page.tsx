import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import NewCardForm from './NewCardForm';

export default async function NewCardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  return (
    <div className="mx-auto max-w-3xl">
      <NewCardForm />
    </div>
  );
}
