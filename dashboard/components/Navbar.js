'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const logged = localStorage.getItem('jobforge_logged_in') === 'true';
    setIsLoggedIn(logged);

    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('jobforge_logged_in') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  if (!isLoggedIn) return null;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-3 px-4 md:px-8 flex justify-between items-center shadow-2xl">
      
      {/* Left side: Hamburger button + Logo */}
      <div className="flex items-center gap-4">
        {/* Hamburger menu button visible only on mobile/tablet */}
        <button
          onClick={handleToggleSidebar}
          type="button"
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer select-none"
          title="Toggle Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Two-color Brand Logo */}
        <Link href="/" className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-purple-500/25">
            JF
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            JobForge AI
          </span>
        </Link>
      </div>

      {/* Right side: SaaS buttons and Avatar */}
      <div className="flex items-center gap-3">
        <a
          href="http://localhost:3000/profile"
          className="hidden sm:inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition"
        >
          Install Extension
        </a>
        <Link
          href="/settings"
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          title="System Settings"
        >
          ⚙️
        </Link>
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-extrabold text-xs text-white shadow-md shadow-purple-500/25 select-none">
          U
        </div>
      </div>

    </nav>
  );
}
