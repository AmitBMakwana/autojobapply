'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
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

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        setError('Failed to load settings: ' + err.message);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setSuccessMsg('Settings saved and successfully applied to runtime services!');
    } catch (err) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Settings</h1>
        <p className="text-gray-400 mt-2">Manage API keys, environment variables, and job scan default preferences.</p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* API Credentials */}
        <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">API Credentials</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Gemini API Key</label>
            <input
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => handleChange('geminiApiKey', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Adzuna App ID</label>
              <input
                type="text"
                value={settings.adzunaAppId}
                onChange={(e) => handleChange('adzunaAppId', e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Adzuna API Key</label>
              <input
                type="password"
                value={settings.adzunaApiKey}
                onChange={(e) => handleChange('adzunaApiKey', e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">JSearch (RapidAPI) Key</label>
            <input
              type="password"
              value={settings.rapidApiKey}
              onChange={(e) => handleChange('rapidApiKey', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
            />
          </div>
        </div>

        {/* Aggregator Preferences */}
        <div className="p-6 rounded-2xl bg-[#11131a] border border-gray-800/80 shadow-md space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Aggregation Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Default Job Title Query</label>
              <input
                type="text"
                value={settings.defaultJobTitle}
                onChange={(e) => handleChange('defaultJobTitle', e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Default Search Location</label>
              <input
                type="text"
                value={settings.defaultLocation}
                onChange={(e) => handleChange('defaultLocation', e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-cyan-500 rounded-xl text-gray-200 text-sm focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Minimum Fit Score Match Threshold ({settings.minFitScore}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.minFitScore}
              onChange={(e) => handleChange('minFitScore', e.target.value)}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-4 rounded-xl font-bold text-sm tracking-wider shadow-lg transition-all duration-300 border cursor-pointer ${
              saving
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-cyan-500 border-cyan-500 hover:bg-cyan-400 text-black hover:scale-105 shadow-cyan-500/10 hover:shadow-cyan-500/20'
            }`}
          >
            {saving ? 'Saving Config...' : 'Apply System Config'}
          </button>
        </div>

      </form>
    </div>
  );
}
