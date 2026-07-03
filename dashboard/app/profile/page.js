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
        console.log('No profile uploaded yet');
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
      const data = await api.uploadResume(file);
      setProfile(data.profile);
      setSuccessMsg('Resume parsed and master profile loaded successfully!');
    } catch (err) {
      setError(err.message || 'Failed to parse resume.');
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

  const handleWorkChange = (index, field, value) => {
    setProfile(prev => {
      const history = [...prev.workHistory];
      history[index] = { ...history[index], [field]: value };
      return { ...prev, workHistory: history };
    });
  };

  const handleWorkBulletChange = (workIdx, bulletIdx, value) => {
    setProfile(prev => {
      const history = [...prev.workHistory];
      const bullets = [...history[workIdx].bullets];
      bullets[bulletIdx] = value;
      history[workIdx] = { ...history[workIdx], bullets };
      return { ...prev, workHistory: history };
    });
  };

  const addWorkBullet = (workIdx) => {
    setProfile(prev => {
      const history = [...prev.workHistory];
      const bullets = [...(history[workIdx].bullets || []), ''];
      history[workIdx] = { ...history[workIdx], bullets };
      return { ...prev, workHistory: history };
    });
  };

  const removeWorkBullet = (workIdx, bulletIdx) => {
    setProfile(prev => {
      const history = [...prev.workHistory];
      const bullets = [...history[workIdx].bullets];
      bullets.splice(bulletIdx, 1);
      history[workIdx] = { ...history[workIdx], bullets };
      return { ...prev, workHistory: history };
    });
  };

  const addWorkExperience = () => {
    setProfile(prev => ({
      ...prev,
      workHistory: [
        ...(prev.workHistory || []),
        { company: '', title: '', dates: '', bullets: [''] }
      ]
    }));
  };

  const removeWorkExperience = (index) => {
    setProfile(prev => {
      const history = [...prev.workHistory];
      history.splice(index, 1);
      return { ...prev, workHistory: history };
    });
  };

  const handleEducationChange = (index, field, value) => {
    setProfile(prev => {
      const edu = [...prev.education];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  };

  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { institution: '', degree: '', dates: '', gpa: '' }
      ]
    }));
  };

  const removeEducation = (index) => {
    setProfile(prev => {
      const edu = [...prev.education];
      edu.splice(index, 1);
      return { ...prev, education: edu };
    });
  };

  const handleSkillChange = (index, value) => {
    setProfile(prev => {
      const skills = [...prev.skills];
      skills[index] = value;
      return { ...prev, skills };
    });
  };

  const addSkill = () => {
    setProfile(prev => ({
      ...prev,
      skills: [...(prev.skills || []), '']
    }));
  };

  const removeSkill = (index) => {
    setProfile(prev => {
      const skills = [...prev.skills];
      skills.splice(index, 1);
      return { ...prev, skills };
    });
  };

  const handleCertChange = (index, value) => {
    setProfile(prev => {
      const certs = [...prev.certifications];
      certs[index] = value;
      return { ...prev, certifications: certs };
    });
  };

  const addCert = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), '']
    }));
  };

  const removeCert = (index) => {
    setProfile(prev => {
      const certs = [...prev.certifications];
      certs.splice(index, 1);
      return { ...prev, certifications: certs };
    });
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
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Resumes & Profile</h1>
        <p className="text-gray-400 mt-2">Manage your master portfolio data or parse a resume file to populate AI keyword matrices.</p>
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
      <div className="p-8 rounded-2xl glass-panel shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-200">Upload Master Resume</h2>
          <p className="text-sm text-gray-500">Extracts text and parses skills using Gemini.</p>
        </div>
        <label className={`px-8 py-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 border ${
          uploading
            ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
            : 'bg-purple-600 border-purple-600 hover:bg-purple-500 text-white hover:scale-105 shadow-purple-500/15'
        }`}>
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-purple-900 border-t-white rounded-full animate-spin"></div>
              Parsing Resume...
            </>
          ) : (
            <>
              <span>📂</span> Choose Resume File
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
          <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Full Name</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Email Address</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Location (City, Country)</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section: Professional Summary */}
          <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Professional Summary</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Summary Description</label>
              <textarea
                value={profile.summary || ''}
                onChange={(e) => handleFormChange('summary', e.target.value)}
                rows="4"
                className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition font-light resize-none"
              ></textarea>
            </div>
          </div>

          {/* Section: Work History */}
          <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-lg font-bold text-white">Work Experience</h3>
              <button
                type="button"
                onClick={addWorkExperience}
                className="px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-600/20 transition cursor-pointer"
              >
                + Add Role
              </button>
            </div>
            
            <div className="space-y-6 divide-y divide-white/5">
              {profile.workHistory?.map((work, wIdx) => (
                <div key={wIdx} className="pt-6 first:pt-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">Role #{wIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(wIdx)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold transition cursor-pointer"
                    >
                      Delete Role
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Company Name</label>
                      <input
                        type="text"
                        value={work.company || ''}
                        onChange={(e) => handleWorkChange(wIdx, 'company', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Job Title</label>
                      <input
                        type="text"
                        value={work.title || ''}
                        onChange={(e) => handleWorkChange(wIdx, 'title', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Dates (e.g. 2022 - Present)</label>
                      <input
                        type="text"
                        value={work.dates || ''}
                        onChange={(e) => handleWorkChange(wIdx, 'dates', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Bullet Points</label>
                      <button
                        type="button"
                        onClick={() => addWorkBullet(wIdx)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition cursor-pointer"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {work.bullets?.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleWorkBulletChange(wIdx, bIdx, e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-gray-950 border border-white/5 focus:border-purple-500 rounded-lg text-gray-300 text-xs focus:outline-none transition"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeWorkBullet(wIdx, bIdx)}
                            className="text-gray-500 hover:text-red-400 font-bold transition text-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Skills & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Skills */}
            <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-lg font-bold text-white">Skills Matrix</h3>
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-600/20 transition cursor-pointer"
                >
                  + Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {profile.skills?.map((skill, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-gray-950 border border-white/5 rounded-lg px-3 py-1">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      className="bg-transparent border-none outline-none text-gray-200 text-xs w-24 focus:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-gray-500 hover:text-red-400 font-bold text-[10px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-lg font-bold text-white">Certifications</h3>
                <button
                  type="button"
                  onClick={addCert}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-600/20 transition cursor-pointer"
                >
                  + Add Cert
                </button>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {profile.certifications?.map((cert, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => handleCertChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-950 border border-white/5 focus:border-purple-500 rounded-lg text-gray-300 text-xs focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => removeCert(index)}
                      className="text-gray-500 hover:text-red-400 font-bold transition text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Section: Education */}
          <div className="p-6 rounded-2xl glass-panel shadow-md space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-lg font-bold text-white">Education History</h3>
              <button
                type="button"
                onClick={addEducation}
                className="px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-600/20 transition cursor-pointer"
              >
                + Add Degree
              </button>
            </div>
            
            <div className="space-y-6">
              {profile.education?.map((edu, eIdx) => (
                <div key={eIdx} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">Degree #{eIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeEducation(eIdx)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold transition cursor-pointer"
                    >
                      Delete Degree
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Institution Name</label>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        onChange={(e) => handleEducationChange(eIdx, 'institution', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Degree / Major</label>
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => handleEducationChange(eIdx, 'degree', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Dates of Study</label>
                      <input
                        type="text"
                        value={edu.dates || ''}
                        onChange={(e) => handleEducationChange(eIdx, 'dates', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">GPA (Optional)</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => handleEducationChange(eIdx, 'gpa', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-4 rounded-xl font-bold text-xs tracking-wider uppercase shadow-lg transition-all duration-300 border cursor-pointer ${
                saving
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-purple-600 border-purple-600 hover:bg-purple-500 text-white hover:scale-105 shadow-purple-500/20'
              }`}
            >
              {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
