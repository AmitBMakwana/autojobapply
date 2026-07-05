'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState('A');
  const [userName, setUserName] = useState('Amit Makwana');
  const [userEmail, setUserEmail] = useState('amitbmakwana1@gmail.com');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const logged = localStorage.getItem('jobforge_logged_in') === 'true';
    setIsLoggedIn(logged);
    const name = localStorage.getItem('jobforge_user_name') || 'Amit Makwana';
    const email = localStorage.getItem('jobforge_user_email') || 'amitbmakwana1@gmail.com';
    setUserInitial(name[0]?.toUpperCase() || 'A');
    setUserName(name);
    setUserEmail(email);

    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('jobforge_logged_in') === 'true');
      const currentName = localStorage.getItem('jobforge_user_name') || 'Amit Makwana';
      const currentEmail = localStorage.getItem('jobforge_user_email') || 'amitbmakwana1@gmail.com';
      setUserInitial(currentName[0]?.toUpperCase() || 'A');
      setUserName(currentName);
      setUserEmail(currentEmail);
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
        <button
          onClick={() => window.dispatchEvent(new Event('open-install-guide'))}
          className="px-3 py-2 bg-[#10b981] hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-200 active:scale-95 cursor-pointer shadow-sm"
        >
          Install Extension
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event('open-install-guide'))}
          className="hidden md:inline-block text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-white transition cursor-pointer"
        >
          How it works
        </button>
        <Link
          href="/upgrade"
          className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-white transition"
        >
          Upgrade
        </Link>
        <a
          href="https://discord.gg/JobForge AI"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.29,78.29,78.29,0,0,0,6.73-11A68.7,68.7,0,0,1,28.8,77.4c1-.77,2-1.56,3-2.3a74.1,74.1,0,0,0,73.57,0c1,.74,2,1.53,3,2.3A68.56,68.56,0,0,1,97.4,82.85a78.89,78.89,0,0,0,6.73,11,105.73,105.73,0,0,0,32-16.29C130.66,48.24,124.61,25.42,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,82.69,40.36,94.07,46,94.07,53,89,65.69,82.69,65.69Z" />
          </svg>
          Need Help?
        </a>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(prev => !prev)}
            className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center font-extrabold text-xs text-white shadow-md shadow-purple-500/25 select-none cursor-pointer"
          >
            {userInitial}
          </button>
          {showDropdown && (
            <>
              {/* Click outside overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>

              {/* Dropdown Menu Container */}
              <div className="absolute right-0 mt-3 z-50 w-72 bg-[#111224] border border-white/5 rounded-2xl shadow-2xl overflow-hidden animate-fade-in text-left">
                {/* User Info Header */}
                <div className="p-4 flex items-center gap-3.5 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-extrabold text-sm text-white select-none">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{userName}</div>
                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{userEmail}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1.5 space-y-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <span>⚙️</span> Account settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      localStorage.removeItem('jobforge_logged_in');
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-left cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-[#0a0b18]/60 border-t border-white/5 text-[9px] text-gray-500 font-bold text-center select-none">
                  Secured by <span className="text-purple-400">@clerk</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </nav>
  );
}
