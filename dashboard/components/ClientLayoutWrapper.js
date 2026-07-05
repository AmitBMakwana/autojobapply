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
  const [plan, setPlan] = useState('Free Plan');

  useEffect(() => {
    setPlan(localStorage.getItem('jobforge_plan') || 'Free Plan');
    const handleStorageChange = () => {
      setPlan(localStorage.getItem('jobforge_plan') || 'Free Plan');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  useEffect(() => {
    const handleOpenGuide = () => {
      setGuideStep(1);
      setIsInstallGuideOpen(true);
    };
    window.addEventListener('open-install-guide', handleOpenGuide);
    return () => window.removeEventListener('open-install-guide', handleOpenGuide);
  }, []);

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
            fixed top-0 left-0 h-full bg-[#0c0d19]/80 backdrop-blur-xl border-r border-white/5 z-50
            flex flex-col justify-between transition-all duration-300 shadow-2xl overflow-y-auto
            lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)]
            ${isSidebarOpen
              ? 'w-[240px] translate-x-0 p-5 gap-6'
              : 'w-[80px] -translate-x-full lg:translate-x-0 lg:w-[80px] lg:px-2.5 lg:py-6 lg:gap-4'
            }
          `}
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Top segment containing Logo/Close button (mobile) + Links */}
          <div className="flex flex-col gap-4">
            {/* Close button inside mobile sidebar header */}
            <div className={`flex justify-between items-center lg:hidden border-b border-white/5 pb-3 ${!isSidebarOpen && 'hidden'}`}>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Navigation Menu</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className={`rounded-xl text-xs font-bold transition flex items-center ${isSidebarOpen
                    ? 'px-4 py-2.5 gap-2'
                    : 'p-2.5 justify-center'
                  } ${pathname === '/'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                title={!isSidebarOpen ? "Dashboard" : undefined}
              >
                <span className="text-sm select-none">📊</span>
                {isSidebarOpen && <span>Dashboard</span>}
              </Link>
              <Link
                href="/jobs"
                className={`rounded-xl text-xs font-bold transition flex items-center ${isSidebarOpen
                    ? 'px-4 py-2.5 gap-2'
                    : 'p-2.5 justify-center'
                  } ${pathname === '/jobs'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                title={!isSidebarOpen ? "Find Job" : undefined}
              >
                <span className="text-sm select-none">📡</span>
                {isSidebarOpen && <span>Find Job</span>}
              </Link>
              <Link
                href="/profile"
                className={`rounded-xl text-xs font-bold transition flex items-center ${isSidebarOpen
                    ? 'px-4 py-2.5 gap-2'
                    : 'p-2.5 justify-center'
                  } ${pathname === '/profile'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                title={!isSidebarOpen ? "Resume" : undefined}
              >
                <span className="text-sm select-none">📄</span>
                {isSidebarOpen && <span>Resume</span>}
              </Link>
              <Link
                href="/tracker"
                className={`rounded-xl text-xs font-bold transition flex items-center ${isSidebarOpen
                    ? 'px-4 py-2.5 gap-2'
                    : 'p-2.5 justify-center'
                  } ${pathname === '/tracker'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                title={!isSidebarOpen ? "Job Tracker" : undefined}
              >
                <span className="text-sm select-none">📋</span>
                {isSidebarOpen && <span>Job Tracker</span>}
              </Link>
              <Link
                href="/settings"
                className={`rounded-xl text-xs font-bold transition flex items-center ${isSidebarOpen
                    ? 'px-4 py-2.5 gap-2'
                    : 'p-2.5 justify-center'
                  } ${pathname === '/settings'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                title={!isSidebarOpen ? "Account" : undefined}
              >
                <span className="text-sm select-none">⚙️</span>
                {isSidebarOpen && <span>Account</span>}
              </Link>
            </div>
          </div>

          {/* Current Plan Indicator Box */}
          {isSidebarOpen && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-md space-y-4 animate-fade-in">
              <div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Current Plan</span>
                <span className="text-sm font-bold text-purple-400 block mt-1">{plan}</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Job extractions</span>
                    <span>
                      {plan === 'Enterprise Plan' || plan === 'Elite Plan'
                        ? `${stats?.applied || 0}/∞`
                        : plan === 'Pro Plan'
                          ? `${stats?.applied || 0}/50`
                          : plan === 'Basic Plan'
                            ? `${stats?.applied || 0}/15`
                            : `${stats?.applied || 0}/6`
                      }
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-950 border border-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      style={{
                        width: `${plan === 'Enterprise Plan' || plan === 'Elite Plan'
                            ? 0
                            : plan === 'Pro Plan'
                              ? Math.min(((stats?.applied || 0) / 50) * 100, 100)
                              : plan === 'Basic Plan'
                                ? Math.min(((stats?.applied || 0) / 15) * 100, 100)
                                : Math.min(((stats?.applied || 0) / 6) * 100, 100)
                          }%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Tailored Resumes</span>
                    <span>
                      {plan === 'Enterprise Plan' || plan === 'Elite Plan'
                        ? `${stats?.tailored || 0}/∞`
                        : plan === 'Pro Plan'
                          ? `${stats?.tailored || 0}/20`
                          : plan === 'Basic Plan'
                            ? `${stats?.tailored || 0}/15`
                            : `${stats?.tailored || 0}/2`
                      }
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-950 border border-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      style={{
                        width: `${plan === 'Enterprise Plan' || plan === 'Elite Plan'
                            ? 0
                            : plan === 'Pro Plan'
                              ? Math.min(((stats?.tailored || 0) / 20) * 100, 100)
                              : plan === 'Basic Plan'
                                ? Math.min(((stats?.tailored || 0) / 15) * 100, 100)
                                : Math.min(((stats?.tailored || 0) / 2) * 100, 100)
                          }%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              {(plan === 'Free Plan' || !plan) && (
                <Link
                  href="/settings"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer block text-center"
                >
                  Upgrade Account
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 min-w-0 px-5 py-5">
          {children}
        </main>

      </div>

      {/* ─── INSTALL EXTENSION 3-STEP GUIDE MODAL ─── */}
      {isInstallGuideOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0c0d19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-left">

            {/* Header / Step indicator */}
            <div className="px-6 py-5 border-b border-white/5 bg-[#0a0b18]/60 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">
                  {guideStep === 1 && "Step 1 of 3: Install Extension"}
                  {guideStep === 2 && "Step 2 of 3: Pin the Extension"}
                  {guideStep === 3 && "Step 3 of 3: You're All Set!"}
                </h2>
                {/* Progress bar container */}
                <div className="w-72 h-1 bg-white/5 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="h-full bg-[#10b981] transition-all duration-300 rounded-full"
                    style={{
                      width: `${guideStep === 1 ? '33.3%' :
                          guideStep === 2 ? '66.6%' :
                            '100%'
                        }`
                    }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => setIsInstallGuideOpen(false)}
                className="text-gray-400 hover:text-white transition text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content body */}
            <div className="p-8 flex flex-col items-center text-center space-y-6">

              {guideStep === 1 && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-white">Install the JobForge AI extension</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Once installed, come back to this tab to continue.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('chrome://extensions/');
                      alert("1. We've copied 'chrome://extensions/' to your clipboard.\n2. Open a new tab, paste it into your address bar, and hit Enter.\n3. Enable 'Developer mode' in the top-right.\n4. Click 'Load unpacked' and select the extension folder 'G:\\autojobapply\\extension'!");
                      window.open('https://github.com/AmitBMakwana/autojobapply', '_blank');
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-[#10b981]/80 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 active:scale-98 cursor-pointer"
                  >
                    Install extension →
                  </button>
                </>
              )}

              {guideStep === 2 && (
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-white">Pin the extension for quick access</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                      Lock JobForge AI to your Chrome toolbar so you can launch it instantly on any job listing page.
                    </p>
                  </div>
                  <div className="bg-[#070811]/60 border border-white/5 rounded-2xl p-4 text-left text-xs text-gray-300 space-y-2.5 max-w-sm mx-auto">
                    <div className="flex gap-2.5 items-start">
                      <span className="text-purple-400 font-bold">1.</span>
                      <span>Click the puzzle icon (🧩) in the top-right corner of Chrome.</span>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-purple-400 font-bold">2.</span>
                      <span>Find <strong className="text-white">JobForge AI</strong> in the extensions drop-down.</span>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-purple-400 font-bold">3.</span>
                      <span>Click the pin icon (📌) next to it to add it to your toolbar.</span>
                    </div>
                  </div>
                </div>
              )}

              {guideStep === 3 && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-white">Yayy you are all done! 🎉</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Now open the Chrome extension on any job page of your preference and simply click on reload button on the extension.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInstallGuideOpen(false)}
                    className="px-6 py-3 bg-[#10b981] hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 active:scale-98 cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              )}

            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 border-t border-white/5 bg-[#0a0b18]/60 flex items-center justify-between">
              <button
                type="button"
                disabled={guideStep === 1}
                onClick={() => setGuideStep(s => Math.max(s - 1, 1))}
                className={`text-xs font-bold transition flex items-center gap-1 ${guideStep === 1
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white cursor-pointer'
                  }`}
              >
                ← Back
              </button>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={`transition-all duration-300 rounded-full ${guideStep === s
                        ? 'w-6 h-1.5 bg-[#10b981]'
                        : 'w-1.5 h-1.5 bg-gray-600'
                      }`}
                  ></div>
                ))}
              </div>

              {guideStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setGuideStep(s => Math.min(s + 1, 3))}
                  className="px-5 py-2 bg-[#10b981] hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition active:scale-98 cursor-pointer"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsInstallGuideOpen(false)}
                  className="px-5 py-2 bg-[#10b981] hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition active:scale-98 cursor-pointer"
                >
                  Get Started
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
