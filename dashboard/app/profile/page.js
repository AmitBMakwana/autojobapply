'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        // Ignored if no profile exists yet
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setSuccessMsg('');
      
      const res = await api.uploadResume(file);
      setProfile(res.profile);
      setSuccessMsg('Resume parsed and profile loaded successfully!');
    } catch (err) {
      setError('Failed to parse resume: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleListChange = (field, index, key, value) => {
    setProfile(prev => {
      const list = [...prev[field]];
      list[index] = { ...list[index], [key]: value };
      return { ...prev, [field]: list };
    });
  };

  const addListItem = (field, defaultObj) => {
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultObj]
    }));
  };

  const removeListItem = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');
      
      const res = await api.updateProfile(profile);
      setProfile(res.profile);
      setSuccessMsg('Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Master Profile</h1>
        <p className="text-gray-400 mt-2">Upload your master resume file or manually edit details to guide the AI tailoring engine.</p>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
          ✅ {successMsg}
        </div>
      )}

      {/* Resume File Upload Block */}
      <div className="p-8 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-200">Upload Master Resume</h2>
          <p className="text-sm text-gray-500">Supports PDF, DOCX, or plain text formats.</p>
        </div>
        <label className={`px-6 py-3.5 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 border ${
          uploading
            ? 'bg-gray-800 border-gray-700 text-gray-400'
            : 'bg-cyan-500 border-cyan-500 hover:bg-cyan-400 text-black hover:scale-105'
        }`}>
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
              Parsing Resume...
            </>
          ) : (
            <>
              <span>📂</span> Choose File
            </>
          )}
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {profile && (
        <form onSubmit={handleSaveProfile} className="space-y-8">
          
          {/* Section: Basic Info */}
          <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Full Name</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Email Address</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                  placeholder="City, State / Remote"
                />
              </div>
            </div>
          </div>

          {/* Section: Summary */}
          <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Professional Summary</h3>
            <textarea
              value={profile.summary || ''}
              onChange={(e) => handleFormChange('summary', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition resize-none"
            />
          </div>

          {/* Section: Skills */}
          <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Skills (Comma-separated)</h3>
            <input
              type="text"
              value={Array.isArray(profile.skills) ? profile.skills.join(', ') : ''}
              onChange={(e) => handleFormChange('skills', e.target.value.split(',').map(s => s.trim()))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
            />
          </div>

          {/* Section: Work Experience */}
          <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-lg font-bold text-white font-semibold">Work Experience</h3>
              <button
                type="button"
                onClick={() => addListItem('workHistory', { company: '', title: '', dates: '', bullets: [] })}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                ➕ Add Position
              </button>
            </div>

            <div className="space-y-6 divide-y divide-gray-800/50">
              {profile.workHistory?.map((job, index) => (
                <div key={index} className="pt-6 first:pt-0 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-extrabold text-cyan-500">Position #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeListItem('workHistory', index)}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 block">Company Name</label>
                      <input
                        type="text"
                        value={job.company || ''}
                        onChange={(e) => handleListChange('workHistory', index, 'company', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 block">Job Title</label>
                      <input
                        type="text"
                        value={job.title || ''}
                        onChange={(e) => handleListChange('workHistory', index, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 block">Employment Dates</label>
                      <input
                        type="text"
                        value={job.dates || ''}
                        onChange={(e) => handleListChange('workHistory', index, 'dates', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition"
                        placeholder="e.g. June 2021 - Present"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 block">Experience Bullet Points (One per line)</label>
                    <textarea
                      value={Array.isArray(job.bullets) ? job.bullets.join('\n') : ''}
                      onChange={(e) => handleListChange('workHistory', index, 'bullets', e.target.value.split('\n'))}
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Education */}
          <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-lg font-bold text-white font-semibold">Education</h3>
              <button
                type="button"
                onClick={() => addListItem('education', { school: '', degree: '', year: '' })}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                ➕ Add School
              </button>
            </div>

            <div className="space-y-6 divide-y divide-gray-800/50">
              {profile.education?.map((edu, index) => (
                <div key={index} className="pt-6 first:pt-0 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-extrabold text-cyan-500">School #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeListItem('education', index)}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 block">School/University</label>
                      <input
                        type="text"
                        value={edu.school || ''}
                        onChange={(e) => handleListChange('education', index, 'school', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 block">Degree / Major</label>
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => handleListChange('education', index, 'degree', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 block">Graduation Year</label>
                      <input
                        type="text"
                        value={edu.year || ''}
                        onChange={(e) => handleListChange('education', index, 'year', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-lg text-gray-200 text-sm focus:outline-none transition"
                        placeholder="e.g. 2022"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-4 rounded-xl font-bold text-sm tracking-wider shadow-lg transition-all duration-300 border cursor-pointer ${
                saving
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-cyan-500 border-cyan-500 hover:bg-cyan-400 text-black hover:scale-105 shadow-cyan-500/10 hover:shadow-cyan-500/20'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-900 border-t-white rounded-full animate-spin inline-block mr-2 align-middle"></div>
                  Saving Changes...
                </>
              ) : (
                'Save Profile Configuration'
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
