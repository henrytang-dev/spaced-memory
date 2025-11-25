'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navLinks } from './IconRail';

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="glass-pill flex items-center justify-between gap-2 px-3 py-2 lg:hidden">
      {navLinks.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition ${
              active ? 'bg-white text-slate-900' : 'bg-white/10 text-white'
            }`}
            title={link.title}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
