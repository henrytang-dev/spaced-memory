import { redirect } from 'next/navigation';
import StudyClient from './StudyClient';
import { isAuthenticated } from '@/lib/authSession';

export default async function StudyPage() {
  if (!isAuthenticated()) redirect('/auth/login');
  return (
    <div className="mx-auto max-w-3xl">
      <StudyClient />
    </div>
  );
}
