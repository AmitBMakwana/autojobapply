'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const COLUMNS = ['Saved', 'Tailored', 'Applied', 'Interview', 'Offer', 'Rejected'];

const COLUMN_COLORS = {
  Saved: 'border-t-indigo-500',
  Tailored: 'border-t-purple-500',
  Applied: 'border-t-cyan-500',
  Interview: 'border-t-yellow-500',
  Offer: 'border-t-emerald-500',
  Rejected: 'border-t-rose-500'
};

const STATUS_META = {
  Saved:     { text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  dot: 'bg-indigo-400' },
  Tailored:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  dot: 'bg-purple-400' },
  Applied:   { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    dot: 'bg-cyan-400' },
  Interview: { text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  dot: 'bg-yellow-400' },
  Offer:     { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  Rejected:  { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    dot: 'bg-rose-400' },
};

const TALLY_ITEMS = [
  { label: 'Applied',      key: 'Applied',   color: 'text-cyan-400',    border: 'border-b-cyan-500' },
  { label: 'Interviewing', key: 'Interview', color: 'text-yellow-400',  border: 'border-b-yellow-500' },
  { label: 'Offers',       key: 'Offer',     color: 'text-emerald-400', border: 'border-b-emerald-500' },
  { label: 'Rejected',     key: 'Rejected',  color: 'text-rose-400',    border: 'border-b-rose-500' },
  { label: 'Saved',        key: 'Saved',     color: 'text-indigo-400',  border: 'border-b-indigo-500' },
  { label: 'Tailored',     key: 'Tailored',  color: 'text-purple-400',  border: 'border-b-purple-500' },
];

export default function TrackerPage() {
  const [board, setBoard]           = useState(null);
  const [allJobs, setAllJobs]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [viewMode, setViewMode]     = useState('list');   // 'list' | 'board'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailTab, setDetailTab]   = useState('details'); // 'details' | 'resume'
  const [activeStatus, setActiveStatus] = useState(null);

  /* ─── load data ─── */
  const loadTrackerData = async () => {
    try {
      setLoading(true);
      const [boardData, jobsData] = await Promise.all([
        api.getKanbanBoard(),
        api.getJobs(),
      ]);
      setBoard(boardData);
      setAllJobs(jobsData);
      if (jobsData.length > 0) setSelectedJob(jobsData[0]);
    } catch (err) {
      setError('Failed to load tracking details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('jobforge_logged_in') !== 'true') {
      window.location.href = '/login';
      return;
    }
    loadTrackerData();
  }, []);

  /* ─── status update ─── */
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const appliedDate = newStatus === 'Applied' ? new Date().toISOString() : null;
      await api.updateJob(jobId, { status: newStatus, appliedDate });

      const patch = (j) => {
        if (j.id !== jobId) return j;
        return { ...j, status: newStatus, ...(appliedDate ? { appliedDate } : {}) };
      };

      setAllJobs(prev => prev.map(patch));
      if (selectedJob?.id === jobId) setSelectedJob(prev => patch(prev));

      setBoard(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        let moved = null;
        for (const col of Object.keys(updated)) {
          const idx = updated[col].findIndex(j => j.id === jobId);
          if (idx !== -1) {
            moved = { ...updated[col][idx], status: newStatus, ...(appliedDate ? { appliedDate } : {}) };
            updated[col] = updated[col].filter((_, i) => i !== idx);
            break;
          }
        }
        if (moved) updated[newStatus] = [...(updated[newStatus] || []), moved];
        return updated;
      });
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  /* ─── helpers ─── */
  const filteredJobs = allJobs.filter(job => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (job.title   || '').toLowerCase().includes(q) ||
      (job.company || '').toLowerCase().includes(q) ||
      (job.location|| '').toLowerCase().includes(q)
    );
    const matchesStatus = !activeStatus || job.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const getTally   = key => allJobs.filter(j => j.status === key).length;

  const timeAgo = date => {
    if (!date) return '';
    const d = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (d === 0) return 'Today';
    if (d < 30)  return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
  };

  const parseJSON = (str) => { try { return JSON.parse(str || '[]'); } catch { return []; } };

  const sm = (status) => STATUS_META[status] || STATUS_META.Saved;

  /* ─── loading state ─── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin" />
        <p className="text-gray-400 font-medium">Loading tracker…</p>
      </div>
    );
  }

  /* ─── render ─── */
  return (
    <div className="w-full space-y-6 animate-fade-in py-2">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Job Tracker</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Manage and track your active job application lifecycle.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* view-mode toggle */}
          <div className="flex rounded-lg bg-white/5 border border-white/8 p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              📋 Split View
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              📊 Kanban
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* ── Tally strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TALLY_ITEMS.map(({ label, key, color, border }) => {
          const isActive = activeStatus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveStatus(isActive ? null : key);
              }}
              className={`text-left rounded-xl px-5 py-4 border transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-purple-950/20 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] border-b-2'
                  : 'bg-[#12131a] border-white/6 hover:border-white/12 hover:bg-white/[0.01] border-b-2'
              } ${border}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">{label}</p>
                {isActive && (
                  <span className="text-[8px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <p className={`text-3xl font-black ${color}`}>{getTally(key)}</p>
            </button>
          );
        })}
      </div>

      {/* ══ SPLIT VIEW ══ */}
      {viewMode === 'list' && (
        <div className="flex gap-4" style={{ height: 'calc(100vh - 300px)', minHeight: '520px' }}>

          {/* ── Left: master list ── */}
          <div className="w-[320px] shrink-0 flex flex-col gap-3">

            {/* search */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, company, or location…"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#12131a] border border-white/8 text-gray-200 text-sm placeholder-gray-600 outline-none focus:border-purple-500/60 transition"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0017 13.414V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
               <p className="text-[11px] font-semibold text-gray-500">{filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''}</p>
               {activeStatus && (
                 <button
                   type="button"
                   onClick={() => setActiveStatus(null)}
                   className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                 >
                   Clear Filter (Show All)
                 </button>
               )}
             </div>

            {/* job list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {filteredJobs.length > 0 ? filteredJobs.map(job => {
                const s = sm(job.status);
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setDetailTab('details'); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-[#1a1b2e] border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.08)]'
                        : 'bg-[#12131a] border-white/6 hover:border-white/15 hover:bg-[#16172a]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-800/80 border border-white/8 flex items-center justify-center text-base shrink-0 mt-0.5">
                        💼
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-100 leading-tight truncate">{job.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{job.company} · {job.location || 'Unknown'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${s.text} ${s.bg} ${s.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {job.status}
                      </span>
                      <span className="text-[11px] text-gray-600 font-medium">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-16 text-center text-gray-600 text-sm">No jobs found.</div>
              )}
            </div>
          </div>

          {/* ── Right: detail panel ── */}
          <div className="flex-1 bg-[#12131a] border border-white/6 rounded-2xl flex flex-col overflow-hidden">
            {selectedJob ? (
              <>
                {/* tabs */}
                <div className="flex gap-6 px-6 border-b border-white/8 shrink-0">
                  {[
                    { key: 'details', icon: '📄', label: 'Job Details',  activeColor: 'text-purple-400 border-purple-500' },
                    { key: 'resume',  icon: '✨', label: 'Resume Used',  activeColor: 'text-cyan-400    border-cyan-500'   },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDetailTab(tab.key)}
                      className={`py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        detailTab === tab.key
                          ? tab.activeColor
                          : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* detail content */}
                <div className="flex-1 overflow-y-auto p-7 space-y-7" style={{ scrollbarWidth: 'thin' }}>

                  {/* ── Job Details Tab ── */}
                  {detailTab === 'details' && (() => {
                    const s = sm(selectedJob.status);
                    const matched = parseJSON(selectedJob.matchedSkills);
                    const missing = parseJSON(selectedJob.missingSkills);
                    return (
                      <div className="space-y-7 animate-fade-in">

                        {/* title row */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gray-800/70 border border-white/8 flex items-center justify-center text-2xl shrink-0">
                              💼
                            </div>
                            <div>
                              <h2 className="text-xl font-extrabold text-white leading-tight">{selectedJob.title}</h2>
                              <p className="text-sm text-gray-400 mt-1">{selectedJob.company} · {selectedJob.location || 'Remote'}</p>
                              {/* status + type badges */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${s.text} ${s.bg} ${s.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                  {selectedJob.status}
                                </span>
                                <span className="px-2.5 py-1 rounded-md border text-[11px] font-bold text-gray-400 bg-white/5 border-white/10">
                                  🏢 Full-time
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {selectedJob.url && (
                              <a
                                href={selectedJob.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5"
                              >
                                ↗ View job posting
                              </a>
                            )}
                            <select
                              value={selectedJob.status}
                              onChange={e => handleStatusChange(selectedJob.id, e.target.value)}
                              className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase outline-none cursor-pointer transition ${s.text} ${s.bg} ${s.border}`}
                            >
                              {COLUMNS.map(c => (
                                <option key={c} value={c} className="bg-[#12131a] text-white">{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* meta grid */}
                        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/6">
                          {[
                            { label: 'Applied On', value: selectedJob.appliedDate ? new Date(selectedJob.appliedDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not applied yet' },
                            { label: 'Source',     value: selectedJob.source || 'Unknown' },
                            { label: 'Fit Score',  value: selectedJob.fitScore ? `${selectedJob.fitScore}%` : 'Not scored' },
                          ].map(item => (
                            <div key={item.label} className="bg-[#0e0f18] px-5 py-4">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                              <p className="text-sm font-semibold text-gray-200 mt-1.5">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* key highlights */}
                        {selectedJob.description && (
                          <div>
                            <h3 className="text-sm font-bold text-white mb-3">Key highlights</h3>
                            <div className="space-y-2">
                              {selectedJob.description.split('\n').filter(l => l.trim()).slice(0, 4).map((line, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                                  <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                  <span className="leading-relaxed">{line.trim()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* skills section */}
                        <div className="space-y-5 pt-4 border-t border-white/6">
                          <h3 className="text-sm font-bold text-white">What we're looking for</h3>

                          {/* matched */}
                          {matched.length > 0 && (
                            <div className="space-y-2.5">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Skills (matched from your resume)</p>
                              <div className="flex flex-wrap gap-2">
                                {matched.map((s, i) => (
                                  <span key={i} className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* missing */}
                          {missing.length > 0 && (
                            <div className="space-y-2.5">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Missing Skills (from job description)</p>
                              <div className="flex flex-wrap gap-2">
                                {missing.map((s, i) => (
                                  <span key={i} className="px-3 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {matched.length === 0 && missing.length === 0 && (
                            <p className="text-sm text-gray-600 italic">
                              No skill analysis available. Use AI Score to analyse this job against your profile.
                            </p>
                          )}
                        </div>

                        {/* rationale */}
                        {selectedJob.rationale && (
                          <div className="space-y-3 pt-4 border-t border-white/6">
                            <h3 className="text-sm font-bold text-white">Requirements</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{selectedJob.rationale}</p>
                          </div>
                        )}

                      </div>
                    );
                  })()}

                  {/* ── Resume Tab ── */}
                  {detailTab === 'resume' && (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center animate-fade-in">
                      <div className="w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center text-3xl">📄</div>
                      <h3 className="text-lg font-bold text-white">No Tailored Resume Found</h3>
                      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                        Use the AI Tailor feature to generate a customised resume for this specific job.
                      </p>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <p className="text-4xl">👈</p>
                <h3 className="text-base font-bold text-gray-300">Select a job</h3>
                <p className="text-sm text-gray-600">Pick an application from the list to see its details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ KANBAN BOARD ══ */}
      {viewMode === 'board' && (
        <div className="flex gap-5 overflow-x-auto pb-6" style={{ scrollbarWidth: 'thin' }}>
          {COLUMNS.map(col => {
            const colJobs = board?.[col] || [];
            const s = sm(col);
            return (
              <div key={col} className={`flex-1 min-w-[270px] max-w-[310px] rounded-2xl border-t-4 border border-white/6 bg-[#12131a] flex flex-col ${COLUMN_COLORS[col]}`}>
                <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/6">
                  <span className={`text-xs font-extrabold tracking-widest uppercase ${s.text}`}>{col}</span>
                  <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">{colJobs.length}</span>
                </div>

                <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto" style={{ maxHeight: '60vh', scrollbarWidth: 'thin' }}>
                  {colJobs.length > 0 ? colJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => { setSelectedJob(job); setViewMode('list'); }}
                      className="p-4 rounded-xl bg-[#0e0f18] border border-white/6 hover:border-white/15 transition cursor-pointer space-y-2.5"
                    >
                      <h4 className="font-bold text-sm text-gray-100 leading-tight line-clamp-2">{job.title}</h4>
                      <p className="text-xs text-purple-400 font-semibold">{job.company}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 font-medium bg-white/5 border border-white/8 px-1.5 py-0.5 rounded">{job.source}</span>
                        {job.fitScore != null && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                            job.fitScore >= 85 ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          }`}>{job.fitScore}%</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="flex-1 flex items-center justify-center py-12 border border-dashed border-white/8 rounded-xl text-xs text-gray-600 italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
