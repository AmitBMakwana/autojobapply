'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [topJobs, setTopJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aggregating, setAggregating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, profileData, jobsData] = await Promise.all([
          api.getStats().catch(() => ({ total: 0, saved: 0, tailored: 0, applied: 0, interviews: 0, offers: 0, rejections: 0, avgAppliedFitScore: 0 })),
          api.getProfile().catch(() => null),
          api.getJobs({ minScore: 70 }).catch(() => [])
        ]);
        
        setStats(statsData);
        setProfile(profileData);
        setTopJobs(jobsData.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRefreshJobs = async () => {
    try {
      setAggregating(true);
      await api.triggerAggregation();
      // Reload lists
      const jobsData = await api.getJobs({ minScore: 70 });
      setTopJobs(jobsData.slice(0, 5));
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      setError('Job scanning failed: ' + err.message);
    } finally {
      setAggregating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading your job workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header Glass Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 glass-panel glow-indigo shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent font-black">{profile?.name || 'Developer'}</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base max-w-2xl font-light">
              Your autonomous AI agent team is scanning platforms, checking fit requirements, and generating tailored portfolios.
            </p>
          </div>
          <button
            onClick={handleRefreshJobs}
            disabled={aggregating}
            className={`px-8 py-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all duration-300 ${
              aggregating
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-105 shadow-purple-500/20'
            }`}
          >
            {aggregating ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-900 border-t-white rounded-full animate-spin"></div>
                Scanning Boards...
              </>
            ) : (
              '⚡ Scan For New Jobs'
            )}
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Scouted Openings', value: stats?.total || 0, color: 'text-purple-400' },
          { label: 'Tailored Portfolios', value: stats?.tailored || 0, color: 'text-indigo-400' },
          { label: 'Applications Sent', value: stats?.applied || 0, color: 'text-cyan-400' },
          { label: 'Avg Match Fit', value: `${stats?.avgAppliedFitScore || 0}%`, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl glass-panel shadow-lg">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block">{stat.label}</span>
            <span className={`text-3xl md:text-4xl font-extrabold mt-2 block ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Grid split: Profile Status vs Top Matched Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-panel shadow-lg space-y-6">
          <h2 className="text-lg font-extrabold text-white border-b border-white/5 pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> Profile Status
          </h2>
          {profile ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Active Resume Profile</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{profile.name}</span>
                <span className="text-xs text-gray-400 block">{profile.email}</span>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Top Skills Extracted</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 10).map((skill, index) => (
                    <span key={index} className="text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-gray-300 font-medium">
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 10 && (
                    <span className="text-xs text-gray-500 flex items-center pl-1 font-semibold">+{profile.skills.length - 10} more</span>
                  )}
                </div>
              </div>
              <Link
                href="/profile"
                className="w-full py-3 rounded-xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-xs font-bold tracking-wider uppercase text-center block text-purple-300 transition-all cursor-pointer"
              >
                Update Profile / Upload Resume
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-200">No Resume Profile Active</h3>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                  Upload your master resume to let the AI score and tailor your applications.
                </p>
              </div>
              <Link
                href="/profile"
                className="inline-block px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
              >
                Upload Resume Now
              </Link>
            </div>
          )}
        </div>

        {/* Top Matched Jobs Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> High Match Openings (+70%)
            </h2>
            <Link href="/jobs" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 tracking-wider uppercase">
              View All Feed →
            </Link>
          </div>

          <div className="divide-y divide-white/5 space-y-4">
            {topJobs.length > 0 ? (
              topJobs.map((job) => (
                <div key={job.id} className="pt-4 first:pt-0 flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-200 text-sm truncate">{job.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="font-semibold text-gray-300">{job.company}</span>
                      <span>•</span>
                      <span>{job.location || 'Remote'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg border ${
                      job.fitScore >= 85
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    }`}>
                      {job.fitScore}% Fit
                    </span>
                    <Link
                      href={`/jobs?highlight=${job.id}`}
                      className="px-3.5 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-xs font-bold tracking-wider uppercase transition-all text-gray-300 hover:text-white"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                No high matching jobs scouted yet. Try scanning or check your search preferences!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
