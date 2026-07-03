'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Job Feed', href: '/jobs' },
    { name: 'Kanban Tracker', href: '/tracker' },
    { name: 'My Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0d0f12]/80 backdrop-blur-md border-b border-gray-800 text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-lg text-black shadow-md shadow-cyan-500/20">
          A
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          ApplyAI
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
