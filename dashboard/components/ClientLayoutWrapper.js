'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ClientLayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState({ total: 0, applied: 0, tailored: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close mobile-overlay on route change (on desktop keep open)
  useEffect(() => {
    // On desktop don't auto-close — just close mobile overlay
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  // Toggle sidebar listener
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  // Update authentication state on route changes
  useEffect(() => {
    const logged = localStorage.getItem('jobforge_logged_in') === 'true';
    setIsLoggedIn(logged);
    setCheckingAuth(false);

    // Auth redirection guards
    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    const isRootRoute = pathname === '/';
    
    if (!logged && !isAuthRoute && !isRootRoute) {
      router.push('/login');
    } else if (logged && isAuthRoute) {
      router.push('/');
    }

    if (logged) {
      // Load plan extraction progress stats
      api.getStats()
        .then(data => setStats(data))
        .catch(() => setStats({ total: 1, applied: 0, tailored: 0 }));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('jobforge_logged_in');
    setIsLoggedIn(false);
    router.push('/');
  };

  // If loading auth details, show loader
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading session...</p>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = !isLoggedIn && pathname === '/';

  // --- VIEW A: FULL-WIDTH PAGES (GUESTS, LOGIN, SIGNUP) ---
  if (isAuthPage || isLandingPage) {
    return <div className="w-full">{children}</div>;
  }

  // --- VIEW B: UNIFIED SYSTEM PANEL WITH LEFT SIDEBAR ---
  return (
    <div className="w-full max-w-screen-2xl mx-auto animate-fade-in">
      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        
        {/* ── Left Sidebar ── */}
        {/* Mobile: fixed overlay; Desktop: collapsible inline column */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-[240px] bg-[#0a0a0f]/99 p-5 border-r border-white/5 z-50
            flex flex-col gap-4 transition-transform duration-300 shadow-2xl
            lg:static lg:shadow-none lg:bg-transparent lg:border-none
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full lg:hidden lg:w-0'}
          `}
        >
          {/* Close button inside mobile sidebar header */}
          <div className="flex justify-between items-center lg:hidden border-b border-white/5 pb-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Navigation Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-5 rounded-2xl glass-panel shadow-md space-y-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  pathname === '/'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📊 Overview
              </Link>
              <Link
                href="/jobs"
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  pathname === '/jobs'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📡 Job Sourcing
              </Link>
              <Link
                href="/tracker"
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  pathname === '/tracker'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📋 Job Tracker
              </Link>
              <Link
                href="/profile"
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  pathname === '/profile'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📄 Resumes
              </Link>
              <Link
                href="/settings"
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  pathname === '/settings'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                ⚙️ Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 text-left transition flex items-center gap-2 cursor-pointer mt-4"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>

          {/* Current Plan Indicator Box */}
          <div className="p-5 rounded-2xl glass-panel shadow-md space-y-4">
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Current Plan</span>
              <span className="text-sm font-bold text-purple-400 block mt-1">Free Plan</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>Job extractions</span>
                  <span>{stats?.applied || 0}/6</span>
                </div>
                <div className="h-1.5 bg-gray-950 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(((stats?.applied || 0) / 6) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>Tailored Resumes</span>
                  <span>{stats?.tailored || 0}/2</span>
                </div>
                <div className="h-1.5 bg-gray-950 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(((stats?.tailored || 0) / 2) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer">
              Upgrade Account
            </button>
          </div>
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 min-w-0 px-5 py-5">
          {children}
        </main>

      </div>
    </div>
  );
}
