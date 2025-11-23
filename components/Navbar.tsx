'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/cards', label: 'Cards' },
  { href: '/cards/new', label: 'Add Card' },
  { href: '/study', label: 'Study' }
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
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-semibold text-white">
            <span className="text-accent">Spaced</span> Memory
          </Link>
          <div className="hidden items-center gap-2 text-sm md:flex">
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
