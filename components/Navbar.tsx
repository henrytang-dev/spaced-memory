'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const links = [
  { href: '/dashboard', label: 'Pulse' },
  { href: '/cards', label: 'Archive' },
  { href: '/cards/new', label: 'Capture' },
  { href: '/study', label: 'Session' }
];

export default function Navbar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  const active = useMemo(() => pathname, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return (
    <nav className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-glow backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-1 flex-col">
            <Link href="/" className="text-2xl font-semibold text-white">
              <span className="text-accent">Spaced</span> Memory
            </Link>
            <p className="text-xs uppercase tracking-[0.5em] text-white/50">Signal aligned</p>
          </div>
          <div className="hidden items-center gap-2 text-sm rounded-full border border-white/10 bg-white/5 px-3 py-1 md:flex">
            {links.map((link) => {
              const isActive = active?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1 transition ${
                    isActive ? 'bg-accent text-midnight-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {authenticated ? (
            <button onClick={handleLogout} className="btn-secondary whitespace-nowrap">
              Logout
            </button>
          ) : (
            <Link href="/auth/login" className="btn-primary whitespace-nowrap">
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-sm text-white/60 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 rounded-full px-3 py-2 text-center ${
              active?.startsWith(link.href) ? 'bg-accent text-midnight-900' : 'bg-white/10'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
