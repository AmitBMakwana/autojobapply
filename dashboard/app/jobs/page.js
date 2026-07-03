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
    setTailoredDocs(null);
    try {
      const docs = await api.getTailoredDocs(jobId);
      setTailoredDocs(docs);
    } catch {
      // Ignored if not tailored yet
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setSuccess('');
    setError('');
    loadTailoredDocs(job.id);
  };

  const handleTriggerAggregation = async (e) => {
    e.preventDefault();
    try {
      setAggregating(true);
      setError('');
      setSuccess('');
      
      const res = await api.triggerAggregation(searchTitle, searchLocation);
      const updatedJobs = await api.getJobs();
      setJobs(updatedJobs);
      
      setSuccess(`Scan finished. Found ${res.addedCount} new jobs, scored ${res.scoredCount} against your resume.`);
      
      if (updatedJobs.length > 0) {
        setSelectedJob(updatedJobs[0]);
        loadTailoredDocs(updatedJobs[0].id);
      }
    } catch (err) {
      setError('Job scanning failed: ' + err.message);
    } finally {
      setAggregating(false);
    }
  };

  const handleTailorDocs = async () => {
    if (!selectedJob) return;
    try {
      setTailoring(true);
      setError('');
      setSuccess('');

      const res = await api.tailorJob(selectedJob.id);
      setTailoredDocs(res.tailoredDoc);
      
      // Update local job status
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'Tailored' } : j));
      setSelectedJob(prev => ({ ...prev, status: 'Tailored' }));
      
      setSuccess('Resume and cover letter tailored successfully!');
    } catch (err) {
      setError('Tailoring failed: ' + err.message);
    } finally {
      setTailoring(false);
    }
  };

  // Filtered jobs list
  const filteredJobs = jobs.filter(job => {
    const scoreMatches = (job.fitScore || 0) >= minScore;
    const statusMatches = !statusFilter || job.status === statusFilter;
    return scoreMatches && statusMatches;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Scouting job openings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Aggregator Trigger Form */}
      <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md">
        <h2 className="text-xl font-bold text-white mb-4">Job Scanner</h2>
        <form onSubmit={handleTriggerAggregation} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Target Title / Keywords</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="e.g. Frontend Engineer, Product Manager"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Preferred Location</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="e.g. Remote, San Francisco, London"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={aggregating}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 ${
              aggregating
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black hover:scale-102'
            }`}
          >
            {aggregating ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-900 border-t-white rounded-full animate-spin"></div>
                Scanning Boards...
              </>
            ) : (
              'Scan Job Boards'
            )}
          </button>
        </form>
      </div>

      {/* Error & Success Messages */}
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

      {/* Main Panel View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Jobs List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick Filters */}
          <div className="p-4 rounded-xl bg-[#11131a] border border-gray-800/80 flex justify-between gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Minimum Match Score</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 text-xs py-1.5 px-2 rounded-lg text-gray-300 outline-none"
              >
                <option value="0">All Match Scores</option>
                <option value="50">50%+ Match</option>
                <option value="75">75%+ Match</option>
                <option value="90">90%+ Match</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Status Column</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-xs py-1.5 px-2 rounded-lg text-gray-300 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Saved">Saved</option>
                <option value="Tailored">Tailored</option>
                <option value="Applied">Applied</option>
              </select>
            </div>
          </div>

          {/* List Scroll Area */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-[#151922] border-cyan-500/50 shadow-cyan-500/5'
                        : 'bg-[#11131a] border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-200 text-sm truncate">{job.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 font-semibold">{job.company}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{job.location || 'Remote'}</p>
                      </div>
                      {job.fitScore !== null ? (
                        <span className={`text-xs font-extrabold px-2.5 py-1.5 rounded-lg border shrink-0 ${
                          job.fitScore >= 85
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : job.fitScore >= 65
                              ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}>
                          {job.fitScore}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 bg-gray-900 border border-gray-800 rounded-md text-gray-500 shrink-0">
                          UNSCORED
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800/40">
                      <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800">
                        {job.source}
                      </span>
                      <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                        job.status === 'Tailored'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : job.status === 'Applied'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-gray-900 text-gray-400 border border-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#11131a] border border-gray-800/80 rounded-2xl text-gray-500 text-sm">
                No jobs match the current filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Selected Job Detail */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-lg space-y-6">
              
              {/* Job Header */}
              <div className="border-b border-gray-800 pb-4 flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white leading-tight">{selectedJob.title}</h2>
                  <p className="text-sm text-cyan-400 font-bold mt-1">{selectedJob.company}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedJob.location || 'Remote'}</p>
                </div>
                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold transition-all text-white border border-gray-700 shrink-0 cursor-pointer"
                  >
                    Open Posting ↗
                  </a>
                )}
              </div>

              {/* Fit Score Rationale */}
              {selectedJob.fitScore !== null && (
                <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-cyan-400">{selectedJob.fitScore}% Fit Score</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Calculated by Gemini</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-light">{selectedJob.rationale}</p>
                  
                  {/* Skills tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-800/60">
                    <div className="space-y-2">
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Matched Keywords</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.matchedSkills?.map((skill, i) => (
                          <span key={i} className="text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                            {skill}
                          </span>
                        )) || <span className="text-xs text-gray-500">None detected</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-orange-400 font-bold uppercase tracking-wider block">Missing Keywords</span>
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
              )}

              {/* Actions & Document Tailoring */}
              <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Tailored Documents Drafts</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                    tailoredDocs 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}>
                    {tailoredDocs ? 'Ready' : 'Not Drafted'}
                  </span>
                </div>

                {tailoredDocs ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-center space-y-2">
                        <span className="text-xs text-gray-400 font-semibold block">Tailored Resume</span>
                        <div className="flex justify-center gap-2">
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'resume', 'pdf')}
                            className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold rounded-lg hover:bg-cyan-500/25 transition cursor-pointer"
                          >
                            PDF
                          </a>
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'resume', 'docx')}
                            className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold rounded-lg hover:bg-cyan-500/25 transition cursor-pointer"
                          >
                            DOCX
                          </a>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-center space-y-2">
                        <span className="text-xs text-gray-400 font-semibold block">Cover Letter</span>
                        <div className="flex justify-center gap-2">
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'coverletter', 'pdf')}
                            className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold rounded-lg hover:bg-cyan-500/25 transition cursor-pointer"
                          >
                            PDF
                          </a>
                          <a
                            href={api.downloadDocUrl(selectedJob.id, 'coverletter', 'docx')}
                            className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold rounded-lg hover:bg-cyan-500/25 transition cursor-pointer"
                          >
                            DOCX
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Preview Panel */}
                    <div className="space-y-3 pt-3 border-t border-gray-800/60">
                      <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
                        <button
                          onClick={() => setPreviewTab('resume')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            previewTab === 'resume' ? 'bg-[#00b894] text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          📄 Tailored Resume
                        </button>
                        <button
                          onClick={() => setPreviewTab('coverletter')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                            previewTab === 'coverletter' ? 'bg-[#00b894] text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          ✉️ Cover Letter Text
                        </button>
                      </div>

                      {previewTab === 'resume' ? (
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-xs space-y-4 max-h-[50vh] overflow-y-auto font-sans leading-relaxed">
                          <div>
                            <h4 className="text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 text-[10px]">Summary Override</h4>
                            <p className="text-gray-300 bg-gray-950 p-3 rounded-lg border border-gray-800">{tailoredDocs.tailoredResume?.summary}</p>
                          </div>
                          <div>
                            <h4 className="text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 text-[10px]">Tailored Keywords</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {tailoredDocs.tailoredResume?.skills?.map((skill, idx) => (
                                <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 text-[10px]">Experience Bullets (ATS Adjusted)</h4>
                            <div className="space-y-3">
                              {tailoredDocs.tailoredResume?.workHistory?.map((work, idx) => (
                                <div key={idx} className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-1.5">
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
                        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-xs max-h-[50vh] overflow-y-auto font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {tailoredDocs.tailoredCoverLetter}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleTailorDocs}
                    disabled={tailoring}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 ${
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
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Job Description</h3>
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[40vh] overflow-y-auto">
                  {selectedJob.description}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-24 bg-[#11131a] border border-gray-800/80 rounded-2xl text-gray-500 text-sm">
              Select a job posting to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
