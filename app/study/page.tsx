import { redirect } from 'next/navigation';
import StudyClient from './StudyClient';
import { isAuthenticated } from '@/lib/authSession';

export default async function StudyPage() {
  if (!isAuthenticated()) redirect('/auth/login');
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="glass-card space-y-3">
        <span className="pill">Live session</span>
        <h1 className="text-3xl font-semibold text-white">Immersive review mode</h1>
        <p className="text-white/70">Reveal the answer when ready, then guide FSRS with a single tap.</p>
      </div>
      <StudyClient />
    </div>
  );
}
