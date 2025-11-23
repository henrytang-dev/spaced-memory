import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { isAuthenticated } from '@/lib/authSession';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Spaced Memory',
  description: 'Personal spaced repetition notebook'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authenticated = isAuthenticated();
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-midnight-900 text-gray-100">
        <div className="fixed inset-0 -z-10 bg-grid-glow opacity-70" />
        <div className="fixed inset-0 -z-[5] bg-[radial-gradient(circle_at_top,rgba(84,140,255,0.35),transparent_55%)] blur-3xl" />
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-6 md:px-8">
          <Navbar authenticated={authenticated} />
          <main className="mt-8 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
