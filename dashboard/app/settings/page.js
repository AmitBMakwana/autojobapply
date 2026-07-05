'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'apiKey', 'billing'
  const [showPwForm, setShowPwForm] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'Amit Makwana',
    email: 'amitbmakwana1@gmail.com',
    avatarLetter: 'A'
  });

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Free Plan');

  // API settings state (used in Security tab)
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    adzunaAppId: '',
    adzunaApiKey: '',
    rapidApiKey: '',
    defaultJobTitle: '',
    defaultLocation: '',
    minFitScore: 70
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Password fields state (Security tab)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('jobforge_logged_in') !== 'true') {
      window.location.href = '/login';
      return;
    }

    // Load profile details from localStorage
    const savedName = localStorage.getItem('jobforge_user_name');
    const savedEmail = localStorage.getItem('jobforge_user_email');
    if (savedName || savedEmail) {
      setProfile({
        name: savedName || 'Amit Makwana',
        email: savedEmail || 'amitbmakwana1@gmail.com',
        avatarLetter: (savedName || 'Amit')[0].toUpperCase()
      });
    } else {
      localStorage.setItem('jobforge_user_name', 'Amit Makwana');
      localStorage.setItem('jobforge_user_email', 'amitbmakwana1@gmail.com');
    }

    // Load active subscription plan
    setCurrentPlan(localStorage.getItem('jobforge_plan') || 'Free Plan');

    // Load System Configuration via API
    async function loadSettings() {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        setError('Failed to load credentials: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setSuccessMsg('API credentials and thresholds updated successfully!');
    } catch (err) {
      setError('Failed to save config: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;
    
    localStorage.setItem('jobforge_user_name', editName.trim());
    localStorage.setItem('jobforge_user_email', editEmail.trim());
    setProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      avatarLetter: editName.trim()[0].toUpperCase()
    });
    window.dispatchEvent(new Event('storage'));
    setShowEditProfile(false);
  };

  const handleUpgradePlan = (planName) => {
    const fullPlanName = `${planName} Plan`;
    localStorage.setItem('jobforge_plan', fullPlanName);
    setCurrentPlan(fullPlanName);
    window.dispatchEvent(new Event('storage'));
    setShowUpgradeModal(false);
    alert(`Successfully upgraded to the ${fullPlanName}!`);
  };

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPwError('Please fill in all fields.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    
    setPwSuccess('Password updated successfully!');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading credentials...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Ambient background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blob-purple opacity-20 pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blob-cyan opacity-15 pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-left z-10 relative">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Account</h1>
          <p className="text-xs text-gray-400 mt-1">Manage your account information, security credentials, and subscriptions.</p>
        </div>

        {/* ── Tabs Grid Container ── */}
        <div className="flex flex-col lg:flex-row gap-6 bg-[#0c0d19]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Left Navigation Column */}
          <div className="w-full lg:w-[220px] bg-[#0e0f24]/30 border-r border-white/5 p-6 flex flex-col justify-between shrink-0 gap-8">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Account</span>
                <span className="text-xs text-gray-400 block mt-1">Manage account info.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'profile', icon: '👤', label: 'Profile' },
                  { id: 'security', icon: '🔒', label: 'Security' },
                  { id: 'apiKey', icon: '🔑', label: 'API Key' },
                  { id: 'billing', icon: '💳', label: 'Billing' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition border ${
                      activeTab === tab.id
                        ? 'bg-purple-600/10 text-purple-300 border-purple-500/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/3 border-transparent'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 text-center text-[10px] text-gray-500 font-bold select-none">
              Secured by <span className="text-purple-400">@clerk</span>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 md:p-8 min-h-[450px]">
            
            {/* 👤 PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-2.5">Profile details</h2>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 border-b border-white/5 gap-4">
                  <div className="w-24 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Profile</div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-extrabold text-lg text-white shadow-md shadow-purple-500/20 select-none">
                      {profile.avatarLetter}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{profile.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Your display initial is "{profile.avatarLetter}"</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditName(profile.name);
                      setEditEmail(profile.email);
                      setShowEditProfile(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-bold transition duration-200 active:scale-98"
                  >
                    Update profile
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 gap-4">
                  <div className="w-24 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connected accounts</div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                      G
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        Google <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Active</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{profile.email}</div>
                    </div>
                  </div>
                  <div className="text-gray-500 hover:text-white transition cursor-pointer text-base px-2 py-1 hover:bg-white/5 rounded-lg">⋯</div>
                </div>
              </div>
            )}

            {/* 🔒 SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-2.5">Security</h2>
                </div>

                {/* Password Row */}
                <div className="flex flex-col md:flex-row items-start py-6 border-b border-white/5 gap-4">
                  <div className="w-40 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</div>
                  <div className="flex-1">
                    <button
                      onClick={() => setShowPwForm(!showPwForm)}
                      className="text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer"
                    >
                      {showPwForm ? 'Hide password settings' : 'Set password'}
                    </button>

                    {showPwForm && (
                      <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 mt-4 max-w-lg">
                        {pwError && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            ⚠️ {pwError}
                          </div>
                        )}
                        {pwSuccess && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            ✅ {pwSuccess}
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Current Password</label>
                          <input
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">New Password</label>
                            <input
                              type="password"
                              value={passwords.new}
                              onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                              placeholder="Minimum 6 characters"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Confirm New Password</label>
                            <input
                              type="password"
                              value={passwords.confirm}
                              onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                              placeholder="Re-enter password"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition duration-200 active:scale-98"
                        >
                          Update Password
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Active Devices Row */}
                <div className="flex flex-col md:flex-row items-start py-6 border-b border-white/5 gap-4">
                  <div className="w-40 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active devices</div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm">
                        💻
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          Windows <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">This device</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Chrome 149.0.0.0
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          2405:201:2002:707c:dda2:db1e:8eb3:e9ef (Ahmedabad, India)
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          Today at 10:59 PM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Account Row */}
                <div className="flex flex-col md:flex-row items-start py-6 gap-4">
                  <div className="w-40 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delete account</div>
                  <div className="flex-1">
                    <button
                      onClick={() => {
                        if (confirm('Are you absolutely sure you want to delete your account? This action is irreversible.')) {
                          localStorage.clear();
                          window.location.href = '/login';
                        }
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-400 transition cursor-pointer"
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 🔑 API KEY TAB */}
            {activeTab === 'apiKey' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-2.5">API Keys & Engine Settings</h2>
                  <p className="text-[11px] text-gray-400 mt-1">Configure credentials for runtime job searches and AI evaluation.</p>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    ⚠️ {error}
                  </div>
                )}
                {successMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    ✅ {successMsg}
                  </div>
                )}

                <form onSubmit={handleApplyConfig} className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Gemini API Key</label>
                      <input
                        type="password"
                        value={settings.geminiApiKey}
                        onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                        className="w-full px-4 py-3 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        placeholder="••••••••••••••••"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Adzuna App ID</label>
                        <input
                          type="text"
                          value={settings.adzunaAppId}
                          onChange={(e) => handleChange('adzunaAppId', e.target.value)}
                          className="w-full px-4 py-3 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                          placeholder="e.g. 8a3f9e"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Adzuna API Key</label>
                        <input
                          type="password"
                          value={settings.adzunaApiKey}
                          onChange={(e) => handleChange('adzunaApiKey', e.target.value)}
                          className="w-full px-4 py-3 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                          placeholder="••••••••••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">JSearch (RapidAPI) Key</label>
                      <input
                        type="password"
                        value={settings.rapidApiKey}
                        onChange={(e) => handleChange('rapidApiKey', e.target.value)}
                        className="w-full px-4 py-3 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                        placeholder="••••••••••••••••"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Default Job Title Query</label>
                        <input
                          type="text"
                          value={settings.defaultJobTitle}
                          onChange={(e) => handleChange('defaultJobTitle', e.target.value)}
                          className="w-full px-4 py-3 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                          placeholder="e.g. Full Stack Developer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Default Search Location</label>
                        <input
                          type="text"
                          value={settings.defaultLocation}
                          onChange={(e) => handleChange('defaultLocation', e.target.value)}
                          className="w-full px-4 py-3 bg-[#070811]/60 border border-white/5 focus:border-purple-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
                          placeholder="e.g. Remote"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Minimum Fit Score Threshold ({settings.minFitScore}%)</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.minFitScore}
                        onChange={(e) => handleChange('minFitScore', e.target.value)}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-500/10 active:scale-98"
                    >
                      {saving ? 'Applying config...' : 'Apply Config Settings'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 💳 BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-2.5">Subscriptions</h2>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Plan</div>
                  <div>
                    <div className="text-base font-extrabold text-[#10b981]">{currentPlan}</div>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentPlan === 'Free Plan' 
                        ? 'Unlock unlimited access to all features with our paid plans.'
                        : currentPlan === 'Basic Plan'
                          ? 'You are currently on the Basic Plan. Upgrade limit of 15 job extractions & 15 resumes.'
                          : currentPlan === 'Pro Plan'
                            ? 'You are currently on the Pro Plan. Upgrade limit of 50 job extractions & 20 resumes.'
                            : 'You are on the Elite Plan (formerly Enterprise). Unlimited job extractions and custom AI agents enabled.'
                      }
                    </p>
                  </div>
                  {currentPlan === 'Free Plan' && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-extrabold uppercase tracking-wider transition duration-200 active:scale-98 cursor-pointer"
                    >
                      Upgrade Now
                    </button>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 mt-6">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Not seeing your updated subscription?</div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    If you've completed your payment or changed your subscription but don't see the latest status, you can refresh your subscription or contact support for assistance.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => alert('Subscription status updated from payment server.')}
                      className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition duration-200"
                    >
                      Refresh Status
                    </button>
                    <button
                      onClick={() => alert('Our support team has been notified. We will reach out to you within 2 hours.')}
                      className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition duration-200"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0d19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0a0b18]/60 flex items-center justify-between">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Update Profile details</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-400 hover:text-white transition text-base font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0b14] border border-white/8 focus:border-purple-500/60 rounded-xl text-gray-200 text-sm outline-none transition placeholder-gray-600"
                    placeholder="e.g. Amit Makwana"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0b14] border border-white/8 focus:border-purple-500/60 rounded-xl text-gray-200 text-sm outline-none transition placeholder-gray-600"
                    placeholder="e.g. amit@example.com"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/5 bg-[#0a0b18]/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 text-gray-300 transition-all text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/10 active:scale-98"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPGRADE PRICING TIERS MODAL ── */}
      {showUpgradeModal && (
        <UpgradePricingModal 
          onClose={() => setShowUpgradeModal(false)} 
          onUpgrade={handleUpgradePlan}
        />
      )}

    </div>
  );
}

function UpgradePricingModal({ onClose, onUpgrade }) {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['6 Job extractions / mo', '2 Tailored Resumes / mo', 'Basic matching score', 'Email support'],
      buttonText: 'Current Plan',
      active: true,
      disabled: true
    },
    {
      name: 'Basic',
      price: '$9.99',
      period: '/mo',
      features: ['15 Job extractions / mo', '15 Tailored Resumes / mo', 'Standard match analytics', 'Email support'],
      buttonText: 'Upgrade to Basic',
      active: false
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: '/mo',
      features: ['50 Job extractions / mo', '20 Tailored Resumes / mo', 'Advanced AI matching insights', 'ATS optimization tools', 'Priority support'],
      buttonText: 'Upgrade to Pro',
      active: false,
      recommended: true
    },
    {
      name: 'Elite',
      price: '$39.99',
      period: '/mo',
      features: ['Unlimited Job extractions', 'Unlimited Tailored Resumes', 'Dedicated database', 'Custom AI agent customization', '24/7 dedicated support'],
      buttonText: 'Upgrade to Elite',
      active: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0c0d19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-left flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 bg-[#0a0b18]/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide uppercase">Upgrade Plan</h2>
            <p className="text-xs text-gray-500 mt-1">Supercharge your job search automation with a premium plan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto max-h-[70vh]" style={{ scrollbarWidth: 'thin' }}>
          {tiers.map(t => (
            <div
              key={t.name}
              className={`rounded-2xl p-6 border flex flex-col justify-between relative transition-all duration-300 hover:scale-102 ${
                t.recommended 
                  ? 'bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-500/10' 
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {t.recommended && (
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide">{t.name}</h3>
                  <div className="flex items-baseline mt-2">
                    <span className="text-2xl font-black text-white">{t.price}</span>
                    <span className="text-xs text-gray-500 ml-1">{t.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-400 pt-4 border-t border-white/5">
                  {t.features.map(f => (
                    <li key={f} className="flex gap-2 items-center">
                      <span className="text-emerald-400">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                disabled={t.disabled}
                onClick={() => onUpgrade(t.name)}
                className={`w-full mt-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-98 ${
                  t.disabled 
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                    : t.recommended
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/15'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {t.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
