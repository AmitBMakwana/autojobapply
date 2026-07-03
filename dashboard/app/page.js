'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function RootPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  // Client-side authentication check
  useEffect(() => {
    const loggedIn = localStorage.getItem('jobforge_logged_in') === 'true';
    setIsLoggedIn(loggedIn);
    setCheckingAuth(false);

    if (loggedIn) {
      // Load overview statistics
      api.getStats()
        .then(data => setStats(data))
        .catch(() => setStats({ total: 1, saved: 0, tailored: 0, applied: 0, interviews: 0, offers: 0, rejections: 0 }));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jobforge_logged_in');
    setIsLoggedIn(false);
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Configuring session...</p>
      </div>
    );
  }

  // --- VIEW 1: GUEST MARKETING LANDING PAGE ---
  if (!isLoggedIn) {
    return (
      <div className="space-y-24 bg-[#0a0a0f] text-gray-200 min-h-screen font-sans w-full px-4 sm:px-8 lg:px-16 py-8 flex flex-col items-center">
        
        {/* Landing Navbar */}
        <header className="flex justify-between items-center py-4 border-b border-white/5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-black text-xs text-white">
              JF
            </div>
            <span className="font-extrabold text-lg text-white">JobForge AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider">
              Login
            </Link>
            <Link href="/signup" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg uppercase tracking-wider transition-all hover:scale-105 shadow-md shadow-emerald-500/10">
              Sign Up
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Tailor Your Resume in <span className="bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-transparent">30 Seconds</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-light">
              Stop manually editing bullet points. Get ATS-optimized resumes and custom cover letters matched perfectly to any job description.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold tracking-wider uppercase rounded-xl transition-all hover:scale-105 hover:shadow-lg shadow-emerald-500/10"
            >
              Get Started Free →
            </Link>
          </div>
          
          {/* App Preview Image Mock */}
          <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-white/2 p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-cyan-500/5 blur-3xl"></div>
            <div className="relative rounded-xl border border-white/5 bg-gray-950/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs text-gray-500">jobforge-dashboard/preview</div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/3 space-y-2">
                  <div className="h-4 bg-purple-500/20 rounded-md w-3/4"></div>
                  <div className="h-2.5 bg-white/5 rounded-md w-full"></div>
                  <div className="h-2.5 bg-white/5 rounded-md w-5/6"></div>
                </div>
                <div className="flex-1 p-4 bg-white/2 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-white/10 rounded-md w-1/3"></div>
                    <div className="h-6 bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">95% Match</div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-md w-full"></div>
                  <div className="h-2 bg-white/5 rounded-md w-full"></div>
                  <div className="h-2 bg-white/5 rounded-md w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Extension Interactive Mock */}
        <section className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">See It In Action</h2>
            <p className="text-gray-400 mt-2 text-sm">Our extension parses requirements and scores roles in 1 click.</p>
          </div>
          
          <div className="rounded-2xl border border-white/5 bg-gray-950 p-6 shadow-xl max-w-xl mx-auto flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 w-full border-b border-white/5 pb-3">
              <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center font-bold text-[10px] text-white">JF</div>
              <span className="font-bold text-sm text-white text-left flex-1">JobForge AI Assistant</span>
              <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-400 font-bold uppercase">Extension Active</span>
            </div>
            
            <div className="w-16 h-16 rounded-full border-4 border-purple-500 flex items-center justify-center font-black text-2xl text-purple-400">
              95%
            </div>
            
            <div className="w-full text-left space-y-2">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Key Match Highlights</span>
              <div className="p-3 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-400 space-y-1">
                <p>✓ Matching skills: React, TypeScript, Tailwind CSS</p>
                <p>✓ Expected experience aligns with your profile history</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Loved by Job Seekers</h2>
            <p className="text-gray-400 mt-2 text-sm">Hear from engineers who automated their sourcing cycles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Dylan Reilly', stars: 5, comment: 'WOW! The tailored resume editor is ridiculously cool. I had so much fun checking off each suggestion and seeing the match score go up.' },
              { name: 'Bhavan Chahal', stars: 5, comment: 'JobForge matched my resume to the job description in under 30 seconds, and the result was already very close to what I normally do manually.' },
              { name: 'Hyndhavi Madhu', stars: 5, comment: 'Streamlining of job search improved. This application is saving a lot of time and improved my quality of applications.' }
            ].map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4 text-left">
                <div className="flex gap-1 text-yellow-400">
                  {Array.from({ length: t.stars }).map((_, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-xs text-gray-400 italic leading-relaxed">"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                    {t.name[0]}
                  </div>
                  <span className="text-xs font-bold text-gray-200">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-3xl mx-auto space-y-8 text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How does the resume matching work?', a: 'Our engine uses the Gemini API to analyze your master resume profile against the job description text, identifying keyword overlaps, skills gaps, and rating your compatibility.' },
              { q: 'Does it auto-submit on LinkedIn/Indeed?', a: 'No, to keep your account safe and comply with platform terms of service, final submission clicks are always manual. The extension fills the inputs in 1 click.' },
              { q: 'Can I upload multiple master resumes?', a: 'Currently, the system keeps one active Master Resume profile which you can update dynamically at any time in the Profile panel.' }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-white/5 pb-4">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center py-2 text-sm font-bold text-white hover:text-purple-400 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span>{activeFaq === idx ? '−' : '+'}</span>
                </button>
                {activeFaq === idx && (
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="max-w-5xl mx-auto rounded-3xl p-10 md:p-14 bg-gradient-to-r from-purple-900/10 via-violet-950/5 to-cyan-950/5 border border-purple-500/15 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-cyan-500/5 blur-3xl"></div>
          <h2 className="text-2xl sm:text-3xl font-black text-white relative z-10">Ready to Land Your Dream Job?</h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed relative z-10 font-light">
            Join the group of job seekers automating their resume layouts and matches. Set up your master resume profile now.
          </p>
          <div className="relative z-10">
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold tracking-wider uppercase rounded-xl transition-all hover:scale-105"
            >
              Start Free Today
            </Link>
          </div>
        </section>

        {/* Landing Footer */}
        <footer className="py-8 border-t border-white/5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-[10px]">
          <span>© 2026 JobForge AI. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Contact Support</span>
          </div>
        </footer>

      </div>
    );
  }

  // --- VIEW 2: LOGGED-IN SYSTEM OVERVIEW ---
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in w-full">
      
      {/* Left Sidebar */}
      <aside className="lg:col-span-3 flex flex-col gap-6">
        <div className="p-5 rounded-2xl glass-panel shadow-md space-y-4">
          <div className="flex flex-col gap-2">
            <span className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center gap-2 select-none shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              📊 Overview
            </span>
            <Link href="/profile" className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
              📄 Resumes
            </Link>
            <Link href="/tracker" className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2">
              📋 Job Tracker
            </Link>
            <button onClick={handleLogout} className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 text-left transition flex items-center gap-2 cursor-pointer mt-4">
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

      {/* Main Panel */}
      <main className="lg:col-span-9 space-y-6">
        
        {/* Header Block */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h1 className="text-2xl font-black text-white">Overview</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-white/5 rounded-xl text-xs text-gray-300 select-none">
            <span>📅</span>
            <span>Analysis Period: <strong>Monthly</strong></span>
          </div>
        </div>

        {/* 3 Statistic Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel shadow-md relative overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">All Time</span>
            <span className="text-3xl font-black text-white block mt-2">{stats?.total || 1}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Total applications tracked</span>
          </div>
          <div className="p-6 rounded-2xl glass-panel shadow-md relative overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Monthly</span>
            <span className="text-3xl font-black text-purple-400 block mt-2">{stats?.applied || 0}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Applications in last 30 days</span>
          </div>
          <div className="p-6 rounded-2xl glass-panel shadow-md relative overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Last 7 Days</span>
            <span className="text-3xl font-black text-cyan-400 block mt-2">0</span>
            <span className="text-[10px] text-gray-500 block mt-1">Applications in last 7 days</span>
          </div>
        </div>

        {/* Line Chart Component - SVG Plot */}
        <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Application Trends</h3>
            <p className="text-xs text-gray-500 mt-1">Track the number of jobs viewed and jobs applied over time</p>
          </div>

          {/* Line Chart Grid Area (Responsive SVG) */}
          <div className="w-full bg-gray-950/40 border border-white/5 rounded-xl p-4">
            <svg viewBox="0 0 800 280" className="w-full h-auto">
              
              {/* Horizontal grid lines */}
              <line x1="50" y1="50" x2="750" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
              <line x1="50" y1="110" x2="750" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
              <line x1="50" y1="170" x2="750" y2="170" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
              <line x1="50" y1="230" x2="750" y2="230" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Y Axis text */}
              <text x="35" y="55" fill="#475569" fontSize="10" textAnchor="end">3</text>
              <text x="35" y="115" fill="#475569" fontSize="10" textAnchor="end">2</text>
              <text x="35" y="175" fill="#475569" fontSize="10" textAnchor="end">1</text>
              <text x="35" y="235" fill="#475569" fontSize="10" textAnchor="end">0</text>

              {/* X Axis dates */}
              <text x="50" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jun 05</text>
              <text x="166" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jun 11</text>
              <text x="282" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jun 17</text>
              <text x="398" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jun 23</text>
              <text x="514" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jun 29</text>
              <text x="630" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jul 02</text>
              <text x="746" y="255" fill="#475569" fontSize="10" textAnchor="middle">Jul 04</text>

              {/* Line 1: Jobs Applied (cyan-500 / #06b6d4) - simulated points */}
              <path
                d="M 50 230 L 166 230 L 282 230 L 398 230 L 514 230 L 630 170 L 746 170"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Dots for Line 1 */}
              <circle cx="50" cy="230" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="166" cy="230" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="282" cy="230" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="398" cy="230" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="514" cy="230" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="630" cy="170" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="746" cy="170" r="4.5" fill="#0a0a0f" stroke="#06b6d4" strokeWidth="2.5" />

              {/* Line 2: Jobs Viewed (purple-500 / #8b5cf6) - simulated points */}
              <path
                d="M 50 230 L 166 230 L 282 230 L 398 230 L 514 170 L 630 110 L 746 50"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Dots for Line 2 */}
              <circle cx="50" cy="230" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />
              <circle cx="166" cy="230" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />
              <circle cx="282" cy="230" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />
              <circle cx="398" cy="230" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />
              <circle cx="514" cy="170" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />
              <circle cx="630" cy="110" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />
              <circle cx="746" cy="50" r="4.5" fill="#0a0a0f" stroke="#8b5cf6" strokeWidth="2.5" />

            </svg>
          </div>

          {/* Chart Legends */}
          <div className="flex justify-center gap-6 text-xs text-gray-400 font-bold select-none">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 block"></span>
              <span>Jobs Applied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 block"></span>
              <span>Jobs Viewed</span>
            </div>
          </div>
        </div>

      </main>
          </div>
    </div>
  );
}
