'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check local storage auth
    const logged = localStorage.getItem('jobforge_logged_in') === 'true';
    setIsLoggedIn(logged);
    
    // Listen for custom login/logout storage changes
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('jobforge_logged_in') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Job Feed', href: '/jobs' },
    { name: 'Kanban Tracker', href: '/tracker' },
    { name: 'My Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
  ];

  if (!isLoggedIn) return null;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-violet-500 to-cyan-400 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-violet-500/25">
          JF
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
          JobForge AI
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
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
