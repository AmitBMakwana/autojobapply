'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const COLUMNS = ['Saved', 'Tailored', 'Applied', 'Interview', 'Offer', 'Rejected'];

const COLUMN_COLORS = {
  Saved: 'border-t-indigo-500 bg-indigo-500/3',
  Tailored: 'border-t-purple-500 bg-purple-500/3',
  Applied: 'border-t-cyan-500 bg-cyan-500/3',
  Interview: 'border-t-yellow-500 bg-yellow-500/3',
  Offer: 'border-t-emerald-500 bg-emerald-500/3',
  Rejected: 'border-t-rose-500 bg-rose-500/3'
};

export default function TrackerPage() {
  const [board, setBoard] = useState(null);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const loadTrackerData = async () => {
    try {
      setLoading(true);
      const [boardData, jobsData] = await Promise.all([
        api.getKanbanBoard(),
        api.getJobs()
      ]);
      setBoard(boardData);
      setAllJobs(jobsData);
    } catch (err) {
      setError('Failed to load tracking details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackerData();
  }, []);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const appliedDate = newStatus === 'Applied' ? new Date().toISOString() : null;
      await api.updateJob(jobId, { status: newStatus, appliedDate });
      
      // Update local states directly for instant updates
      setAllJobs(prev => prev.map(j => {
        if (j.id === jobId) {
          const updatedJob = { ...j, status: newStatus };
          if (appliedDate) updatedJob.appliedDate = appliedDate;
          return updatedJob;
        }
        return j;
      }));

      setBoard(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        let movedJob = null;
        for (const col of Object.keys(updated)) {
          const index = updated[col].findIndex(j => j.id === jobId);
          if (index !== -1) {
            movedJob = { ...updated[col][index], status: newStatus };
            if (appliedDate) movedJob.appliedDate = appliedDate;
            updated[col].splice(index, 1);
            break;
          }
        }
        if (movedJob) {
          updated[newStatus].push(movedJob);
        }
        return updated;
      });
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Filter jobs based on active tab and search query
  const filteredListJobs = allJobs.filter(job => {
    const title = (job.title || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || 
                          company.includes(searchQuery.toLowerCase()) || 
                          location.includes(searchQuery.toLowerCase());

    if (activeTab === 'ALL') return matchesSearch;
    return job.status.toUpperCase() === activeTab && matchesSearch;
  });

  const getTabCount = (status) => {
    if (status === 'ALL') return allJobs.length;
    return allJobs.filter(j => j.status.toUpperCase() === status).length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Job Tracker</h1>
          <p className="text-gray-400 mt-1">Manage and track your active job application lifecycle.</p>
        </div>
        
        {/* Toggle between Board and List views */}
        <div className="flex rounded-xl bg-gray-900/80 p-1 border border-white/5 shrink-0 self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'list' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'board' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Kanban Board
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* VIEW MODE 1: LIST / TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1 overflow-x-auto">
            {['ALL', ...COLUMNS.map(c => c.toUpperCase())].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 text-xs font-bold tracking-wider relative transition-all uppercase border-b-2 cursor-pointer ${
                  activeTab === tab
                    ? 'text-purple-400 border-purple-400'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab} <span className="text-[10px] text-gray-600 font-semibold">({getTabCount(tab)})</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, company, or location..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
              />
              <span className="absolute left-3.5 top-3.5 text-gray-500">🔍</span>
            </div>
          </div>

          {/* Job Applications Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#11131a]/60 shadow-lg">
            <table className="w-full border-collapse text-left text-sm text-gray-300">
              <thead className="bg-[#11131a] border-b border-white/5 text-xs font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Position / Role</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Applied On</th>
                  <th className="px-6 py-4">Interview Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-light">
                {filteredListJobs.length > 0 ? (
                  filteredListJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-200">
                        {job.url ? (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            {job.title}
                          </a>
                        ) : (
                          job.title
                        )}
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase block mt-1">
                          {job.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-300">{job.company}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-900 border border-white/5 text-xs rounded-md text-gray-400">
                          {job.location || 'Not specified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-emerald-400">
                        {job.appliedDate ? (
                          new Date(job.appliedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          <span className="text-gray-500 italic">Not applied yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className="bg-gray-900 border border-white/5 text-xs py-1.5 px-3 rounded-lg text-gray-300 outline-none cursor-pointer hover:border-gray-700 transition"
                        >
                          {COLUMNS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                      No matching job applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {COLUMNS.map((colName) => {
            const colJobs = board?.[colName] || [];
            return (
              <div
                key={colName}
                className={`flex-1 min-w-[280px] max-w-[320px] rounded-2xl border-t-4 border border-white/5 p-4 flex flex-col gap-4 shadow-md ${COLUMN_COLORS[colName]}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-extrabold text-sm tracking-wide text-gray-200 uppercase">{colName}</span>
                  <span className="bg-gray-800 border border-white/5 text-xs px-2.5 py-0.5 rounded-full font-bold text-gray-400">
                    {colJobs.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 flex flex-col gap-3 min-h-[50vh] overflow-y-auto max-h-[65vh] pr-1">
                  {colJobs.length > 0 ? (
                    colJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-4 rounded-xl bg-gray-900/60 border border-white/5 hover:border-gray-700 transition shadow-sm space-y-3"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-gray-200 line-clamp-1">{job.title}</h4>
                          <p className="text-xs text-purple-400 mt-0.5 font-semibold truncate">{job.company}</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-900 border border-white/5 px-1.5 py-0.5 rounded">
                            {job.source}
                          </span>
                          {job.fitScore !== null && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                              job.fitScore >= 85
                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                            }`}>
                              {job.fitScore}% Fit
                            </span>
                          )}
                        </div>

                        {/* Quick Move Selector */}
                        <div className="pt-2 border-t border-white/5 flex gap-2 justify-between items-center">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Move to:</label>
                          <select
                            value={job.status}
                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                            className="bg-gray-900 border border-white/5 text-[10px] px-1.5 py-0.5 rounded text-gray-300 outline-none cursor-pointer"
                          >
                            {COLUMNS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 border border-dashed border-white/5 rounded-xl flex items-center justify-center py-12 text-xs text-gray-600 font-semibold italic text-center">
                      Empty Column
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
