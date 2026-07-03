'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleContinue = (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    // Simulate auth session storage
    setTimeout(() => {
      localStorage.setItem('jobforge_logged_in', 'true');
      router.push('/');
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f] text-gray-200">
      
      {/* Outer Card Wrapper */}
      <div className="max-w-md w-full space-y-8 glass-panel shadow-2xl p-8 rounded-3xl border border-white/5 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -ml-10 -mt-10"></div>
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-purple-500/25">
            JF
          </div>
          <span className="font-extrabold text-lg text-white">JobForge AI</span>
        </div>

        {/* Card Headers */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Sign in to JobForge AI</h2>
          <p className="text-xs text-gray-400">Welcome back! Please sign in to continue</p>
        </div>

        <form onSubmit={handleContinue} className="space-y-6 mt-6">
          
          {/* Google Button */}
          <button
            type="button"
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-xs font-semibold text-gray-200 transition-all cursor-pointer relative"
          >
            <span className="text-sm">🌐</span>
            <span>Continue with Google</span>
            <span className="absolute top-0 right-3 -mt-2 bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
              Last Used
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span className="h-px bg-white/5 flex-1"></span>
            <span>or</span>
            <span className="h-px bg-white/5 flex-1"></span>
          </div>

          {/* Email input field */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-xs focus:outline-none transition"
              required
            />
          </div>

          {/* Continue button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-500/10 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Connecting...' : 'Continue ▸'}
          </button>
        </form>

        {/* Card Footer Link */}
        <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-white/5">
          Don't have an account?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-bold">
            Sign up
          </Link>
        </div>

        {/* Secured Label */}
        <div className="flex justify-center items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-widest pt-2">
          <span>🔒 Secured by</span>
          <span className="text-gray-400 font-black">Clerk</span>
        </div>

      </div>
    </div>
  );
}
