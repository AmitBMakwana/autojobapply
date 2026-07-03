const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', '..', 'settings.json');

// Helper to load settings
function loadSettings() {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse settings.json:', err);
    }
  }

  // Fallback to environment variables
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    adzunaAppId: process.env.ADZUNA_APP_ID || '',
    adzunaApiKey: process.env.ADZUNA_API_KEY || '',
    rapidApiKey: process.env.RAPIDAPI_KEY || '',
    defaultJobTitle: 'Software Engineer',
    defaultLocation: 'Remote',
    minFitScore: 70
  };
}

/**
 * Retrieve current settings
 */
router.get('/', (req, res) => {
  try {
    const settings = loadSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

/**
 * Update settings
 */
router.put('/', (req, res) => {
  try {
    const { geminiApiKey, adzunaAppId, adzunaApiKey, rapidApiKey, defaultJobTitle, defaultLocation, minFitScore } = req.body;

    const newSettings = {
      geminiApiKey: geminiApiKey || '',
      adzunaAppId: adzunaAppId || '',
      adzunaApiKey: adzunaApiKey || '',
      rapidApiKey: rapidApiKey || '',
      defaultJobTitle: defaultJobTitle || 'Software Engineer',
      defaultLocation: defaultLocation || 'Remote',
      minFitScore: minFitScore !== undefined ? parseInt(minFitScore, 10) : 70
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');

    // Dynamically update process.env for runtime services
    process.env.GEMINI_API_KEY = newSettings.geminiApiKey;
    process.env.ADZUNA_APP_ID = newSettings.adzunaAppId;
    process.env.ADZUNA_API_KEY = newSettings.adzunaApiKey;
    process.env.RAPIDAPI_KEY = newSettings.rapidApiKey;

    res.json({ message: 'Settings saved successfully.', settings: newSettings });
  } catch (error) {
    console.error('Failed to save settings:', error);
    res.status(500).json({ error: 'Failed to save settings: ' + error.message });
  }
});

module.exports = {
  router,
  loadSettings
};
