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
      // Reload jobs & stats
      const [statsData, jobsData] = await Promise.all([
        api.getStats(),
        api.getJobs({ minScore: 70 })
      ]);
      setStats(statsData);
      setTopJobs(jobsData.slice(0, 5));
    } catch (err) {
      alert('Failed to refresh jobs: ' + err.message);
    } finally {
      setAggregating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading ApplyAI dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 bg-gradient-to-r from-[#11131a] to-[#151922] border border-gray-800/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back, {profile?.name || 'Job Hunter'}
            </h1>
            <p className="text-gray-400 mt-2 text-base md:text-lg max-w-2xl font-light">
              Your AI agent team is scanning platforms, scoring matches, and preparing tailored documents.
            </p>
          </div>
          <button
            onClick={handleRefreshJobs}
            disabled={aggregating}
            className={`px-6 py-3.5 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 transition-all duration-300 ${
              aggregating
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black hover:scale-105 hover:shadow-cyan-500/20'
            }`}
          >
            {aggregating ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-900 border-t-white rounded-full animate-spin"></div>
                Refreshing Jobs...
              </>
            ) : (
              'Scan for New Jobs'
            )}
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Scouted Openings', value: stats?.total || 0, color: 'text-blue-400' },
          { label: 'Tailored Drafts', value: stats?.tailored || 0, color: 'text-purple-400' },
          { label: 'Applications Sent', value: stats?.applied || 0, color: 'text-emerald-400' },
          { label: 'Avg Applied Fit', value: `${stats?.avgAppliedFitScore || 0}%`, color: 'text-cyan-400' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md">
            <span className="text-xs font-bold tracking-widest text-gray-500 uppercase block">{stat.label}</span>
            <span className={`text-3xl md:text-4xl font-extrabold mt-2 block ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Grid split: Profile Status vs Top Matched Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Profile Status
          </h2>
          {profile ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800">
                <span className="text-xs text-gray-500 font-semibold block">Primary Resume</span>
                <span className="font-semibold text-gray-200 mt-1 block truncate">{profile.name}</span>
                <span className="text-xs text-gray-400 block">{profile.email}</span>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-gray-500 font-semibold block">Extracted Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 10).map((skill, index) => (
                    <span key={index} className="text-xs bg-gray-800/50 border border-gray-700/50 px-2.5 py-1 rounded-md text-gray-300">
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 10 && (
                    <span className="text-xs text-gray-500 flex items-center pl-1">+{profile.skills.length - 10} more</span>
                  )}
                </div>
              </div>
              <Link
                href="/profile"
                className="w-full py-3 rounded-xl bg-gray-800/60 border border-gray-700/60 hover:bg-gray-800 text-sm font-bold text-center block text-white transition-all cursor-pointer"
              >
                Update Profile / Upload Resume
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center">
                <span className="text-3xl text-cyan-400">📄</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-200">No Profile Active</h3>
                <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                  Upload your master resume to let the AI score and tailor your applications.
                </p>
              </div>
              <Link
                href="/profile"
                className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
              >
                Upload Resume Now
              </Link>
            </div>
          )}
        </div>

        {/* Top Matched Jobs Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> High Match Openings (+70%)
            </h2>
            <Link href="/jobs" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              View All Feed →
            </Link>
          </div>

          <div className="divide-y divide-gray-800/60 space-y-4">
            {topJobs.length > 0 ? (
              topJobs.map((job) => (
                <div key={job.id} className="pt-4 first:pt-0 flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-200 text-base truncate">{job.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="font-semibold text-gray-300">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border ${
                      job.fitScore >= 85
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    }`}>
                      {job.fitScore}% Fit
                    </span>
                    <Link
                      href={`/jobs?highlight=${job.id}`}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-700/60 hover:bg-gray-800 text-xs font-semibold transition-all text-gray-300 hover:text-white"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                No high matching jobs scouted yet. Try scanning or check your search titles!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
