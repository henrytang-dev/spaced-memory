'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const navLinks = [
  { label: '⌂', title: 'Dashboard', href: '/dashboard' },
  { label: '☰', title: 'Cards', href: '/cards' },
  { label: '+', title: 'Create', href: '/cards/new' },
  { label: '▷', title: 'Study', href: '/study' },
  { label: '▦', title: 'Playlists', href: '/playlists' }
];

export default function IconRail({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`icon-rail h-full w-16 items-center justify-between ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {navLinks.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/20 hover:shadow-lg ${
                active ? 'bg-white/25 border-white/60 text-slate-900 font-semibold' : ''
              }`}
              title={link.title}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
