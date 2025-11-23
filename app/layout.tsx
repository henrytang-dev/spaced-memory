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
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="shell relative flex min-h-[90vh] flex-col px-4 pb-10 pt-6 md:px-10">
            <div className="pointer-events-none absolute inset-x-10 top-6 h-24 rounded-full bg-gradient-to-r from-white/10 to-transparent blur-3xl" />
            <Navbar authenticated={authenticated} />
            <main className="relative mt-10 flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
