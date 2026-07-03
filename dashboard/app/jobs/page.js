'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [tailoredDocs, setTailoredDocs] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewTab, setPreviewTab] = useState('resume');

  // Search parameters for aggregation
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // Filtering states
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const initialized = useRef(false);

  useEffect(() => {
    if (localStorage.getItem('jobforge_logged_in') !== 'true') {
      window.location.href = '/login';
      return;
    }
    async function loadJobs() {
      try {
        setLoading(true);
        const data = await api.getJobs();
        setJobs(data);
        
        // Handle highlight query parameter
        if (highlightId) {
          const matched = data.find(j => j.id === highlightId);
          if (matched) {
            setSelectedJob(matched);
            loadTailoredDocs(matched.id);
          }
        } else if (data.length > 0) {
          setSelectedJob(data[0]);
          loadTailoredDocs(data[0].id);
        }
      } catch (err) {
        setError('Failed to load jobs list: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (!initialized.current) {
      initialized.current = true;
      loadJobs();
    }
  }, [highlightId]);

  const loadTailoredDocs = async (jobId) => {
    try {
      setTailoredDocs(null);
      const docs = await api.getTailoredDocs(jobId);
      setTailoredDocs(docs);
    } catch (err) {
      // Ignored if tailored docs don't exist yet
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setError('');
    setSuccess('');
    await loadTailoredDocs(job.id);
  };

  const handleRefreshJobs = async (e) => {
    e.preventDefault();
    try {
      setAggregating(true);
      setError('');
      setSuccess('');
      const res = await api.triggerAggregation(searchTitle, searchLocation);
      setSuccess(res.message);
      
      // Reload jobs
      const data = await api.getJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
        loadTailoredDocs(data[0].id);
      }
    } catch (err) {
      setError('Job scanning failed: ' + err.message);
    } finally {
      setAggregating(false);
    }
  };

  const handleScoreJob = async () => {
    if (!selectedJob) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await api.scoreJob(selectedJob.id);
      setSuccess('Job description scored successfully!');
      
      // Refresh current job details
      setSelectedJob(res.job);
      setJobs(prev => prev.map(j => j.id === res.job.id ? res.job : j));
    } catch (err) {
      setError('Scoring failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTailorDocs = async () => {
    if (!selectedJob) return;
    try {
      setTailoring(true);
      setError('');
      setSuccess('');
      const res = await api.tailorJob(selectedJob.id);
      setSuccess('Resume & Cover Letter tailored successfully!');
      
      // Update status locally
      setSelectedJob(prev => ({ ...prev, status: 'Tailored' }));
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'Tailored' } : j));
      setTailoredDocs(res.tailoredDoc);
    } catch (err) {
      setError('Tailoring failed: ' + err.message);
    } finally {
      setTailoring(false);
    }
  };

  // Local filtering logic
  const filteredJobs = jobs.filter(job => {
    const score = job.fitScore || 0;
    const matchesMinScore = score >= minScore;
    const matchesStatus = statusFilter === '' || job.status === statusFilter;
    return matchesMinScore && matchesStatus;
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Scouting matching vacancies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Search Header Banner */}
      <div className="p-6 rounded-3xl glass-panel shadow-lg">
        <form onSubmit={handleRefreshJobs} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Job Title / Skills</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Location</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="e.g. Remote or Bengaluru"
              className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={aggregating}
            className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 border ${
              aggregating
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-purple-600 border-purple-600 hover:bg-purple-500 text-white hover:scale-102 shadow-purple-500/15'
            }`}
          >
            {aggregating ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-900 border-t-white rounded-full animate-spin"></div>
                Scouting APIs...
              </>
            ) : (
              '🔎 Scan Board Portals'
            )}
          </button>
        </form>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
          ✅ {success}
        </div>
      )}

      {/* Feed Panel Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Filter and List */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Filters */}
          <div className="p-5 rounded-2xl glass-panel shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">Filter Scouted Feed</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Minimum Match Score</span>
                <span className="text-purple-400">{minScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tracking Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-900 border border-white/5 rounded-lg py-1.5 px-2.5 text-xs text-gray-300 outline-none focus:border-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Saved">Saved</option>
                  <option value="Tailored">Tailored</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Scouted Count</label>
                <div className="py-2 text-xs font-bold text-gray-300">{filteredJobs.length} Openings</div>
              </div>
            </div>
          </div>

          {/* Job Feed Cards */}
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className={`p-5 rounded-2xl glass-panel glass-panel-hover shadow cursor-pointer transition-all duration-200 border text-left ${
                    selectedJob?.id === job.id
                      ? 'border-purple-500/80 bg-purple-500/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-gray-200 truncate">{job.title}</h4>
                      <p className="text-xs text-purple-400 mt-1 font-semibold truncate">{job.company}</p>
                    </div>
                    {job.fitScore !== null && (
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${
                        job.fitScore >= 85
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      }`}>
                        {job.fitScore}% Fit
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>{job.location || 'Remote'}</span>
                    <span className="bg-gray-900 border border-white/5 px-2 py-0.5 rounded text-[9px]">
                      {job.source}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 glass-panel border-white/5 rounded-2xl text-gray-500 text-sm">
                No jobs match the current filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Selected Job Detail */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <div className="p-6 rounded-2xl glass-panel shadow-lg space-y-6 text-left">
              
              {/* Job Header */}
              <div className="border-b border-white/5 pb-4 flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">{selectedJob.title}</h2>
                  <p className="text-xs text-purple-400 font-bold mt-1">{selectedJob.company}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedJob.location || 'Remote'}</p>
                </div>
                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold transition-all text-white border border-white/5 shrink-0 cursor-pointer"
                  >
                    Open Posting ↗
                  </a>
                )}
              </div>

              {/* Fit Score Rationale */}
              {selectedJob.fitScore !== null ? (
                <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-4 shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-purple-400">{selectedJob.fitScore}% Fit Score</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Calculated by Gemini</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-light">{selectedJob.rationale}</p>
                  
                  {/* Skills tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                    <div className="space-y-2">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Matched Keywords</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.matchedSkills?.map((skill, i) => (
                          <span key={i} className="text-xs bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400">
                            {skill}
                          </span>
                        )) || <span className="text-xs text-gray-500">None detected</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">Missing Keywords</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.missingSkills?.map((skill, i) => (
                          <span key={i} className="text-xs bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-orange-400">
                            {skill}
                          </span>
                        )) || <span className="text-xs text-gray-500">None detected</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-gray-200 block">Not Scored Yet</span>
                    <p className="text-xs text-gray-400">Run Gemini evaluation to check match keywords and fit score details.</p>
                  </div>
                  <button
                    onClick={handleScoreJob}
                    className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase cursor-pointer"
                  >
                    Evaluate Match
                  </button>
                </div>
              )}

              {/* Actions & Document Tailoring */}
              <div className="p-5 rounded-2xl bg-white/3 border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tailored Documents Drafts</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                    tailoredDocs 
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                      : 'bg-gray-800 border-white/5 text-gray-400'
                  }`}>
                    {tailoredDocs ? 'Ready' : 'Not Drafted'}
                  </span>
                </div>

                {tailoredDocs ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-900 border border-white/5 text-center space-y-2">
                        <span className="text-xs text-gray-400 font-semibold block">Tailored Resume</span>
                        <div className="flex justify-center gap-2">
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'resume', 'pdf')}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-lg hover:bg-purple-500/25 transition cursor-pointer"
                          >
                            PDF
                          </a>
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'resume', 'docx')}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-lg hover:bg-purple-500/25 transition cursor-pointer"
                          >
                            DOCX
                          </a>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-900 border border-white/5 text-center space-y-2">
                        <span className="text-xs text-gray-400 font-semibold block">Cover Letter</span>
                        <div className="flex justify-center gap-2">
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'coverletter', 'pdf')}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-lg hover:bg-purple-500/25 transition cursor-pointer"
                          >
                            PDF
                          </a>
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'coverletter', 'docx')}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-lg hover:bg-purple-500/25 transition cursor-pointer"
                          >
                            DOCX
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Preview Panel */}
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="flex rounded-xl bg-gray-950 p-1 border border-white/5">
                        <button
                          onClick={() => setPreviewTab('resume')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            previewTab === 'resume' ? 'bg-[#8B5CF6] text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          📄 Tailored Resume
                        </button>
                        <button
                          onClick={() => setPreviewTab('coverletter')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            previewTab === 'coverletter' ? 'bg-[#8B5CF6] text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          ✉️ Cover Letter Text
                        </button>
                      </div>

                      {previewTab === 'resume' ? (
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-white/5 text-xs space-y-4 max-h-[50vh] overflow-y-auto font-sans leading-relaxed">
                          <div>
                            <h4 className="text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 text-[10px]">Summary Override</h4>
                            <p className="text-gray-300 bg-gray-955 p-3 rounded-lg border border-white/5">{tailoredDocs.tailoredResume?.summary}</p>
                          </div>
                          <div>
                            <h4 className="text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 text-[10px]">Tailored Keywords</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {tailoredDocs.tailoredResume?.skills?.map((skill, idx) => (
                                <span key={idx} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 text-[10px]">Experience Bullets (ATS Adjusted)</h4>
                            <div className="space-y-3">
                              {tailoredDocs.tailoredResume?.workHistory?.map((work, idx) => (
                                <div key={idx} className="bg-gray-955 p-3 rounded-lg border border-white/5 space-y-1.5">
                                  <div className="flex justify-between font-bold text-gray-200 text-[11px]">
                                    <span>{work.title} @ {work.company}</span>
                                    <span className="text-gray-500 italic font-medium">{work.dates}</span>
                                  </div>
                                  <ul className="list-disc pl-4 text-gray-400 text-[11px] space-y-1">
                                    {work.bullets?.map((bullet, bIdx) => (
                                      <li key={bIdx}>{bullet}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-white/5 text-xs max-h-[50vh] overflow-y-auto font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {tailoredDocs.tailoredCoverLetter}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleTailorDocs}
                    disabled={tailoring}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 ${
                      tailoring
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-102 border border-purple-600'
                    }`}
                  >
                    {tailoring ? (
                      <>
                        <div className="w-4 h-4 border-2 border-purple-900 border-t-white rounded-full animate-spin"></div>
                        Gemini is Tailoring Documents...
                      </>
                    ) : (
                      'Generate Tailored Resume & Cover Letter'
                    )}
                  </button>
                )}
              </div>

              {/* Raw Job Description Text */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job Description</h3>
                <div className="p-4 rounded-xl bg-gray-900 border border-white/5 text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[40vh] overflow-y-auto">
                  {selectedJob.description}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-24 glass-panel border-white/5 rounded-2xl text-gray-500 text-sm">
              Select a job posting to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
