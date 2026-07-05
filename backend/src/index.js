const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration to support Next.js frontend (3000) and Chrome Extensions
app.use(cors({
  origin: '*', // For MVP/extension development ease, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import API Routers
const resumeRouter = require('./api/resume');
const resumesRouter = require('./api/resumes');
const jobsRouter = require('./api/jobs');
const scoreRouter = require('./api/score');
const tailorRouter = require('./api/tailor');
const trackerRouter = require('./api/tracker');
const { router: settingsRouter, loadSettings } = require('./api/settings');

// Apply dynamically loaded settings overrides to process.env
const runtimeSettings = loadSettings();
process.env.GEMINI_API_KEY = runtimeSettings.geminiApiKey || process.env.GEMINI_API_KEY;
process.env.ADZUNA_APP_ID = runtimeSettings.adzunaAppId || process.env.ADZUNA_APP_ID;
process.env.ADZUNA_API_KEY = runtimeSettings.adzunaApiKey || process.env.ADZUNA_API_KEY;
process.env.RAPIDAPI_KEY = runtimeSettings.rapidApiKey || process.env.RAPIDAPI_KEY;

// Register API Routes
app.use('/api/resume', resumeRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/score', scoreRouter);
app.use('/api/tailor', tailorRouter);
app.use('/api/tracker', trackerRouter);
app.use('/api/settings', settingsRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Job-Application Assistant API is running.' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

const prisma = require('./services/db');
async function syncOnStartup() {
  try {
    let defaultResume = await prisma.resume.findFirst({ where: { isDefault: true } });
    if (!defaultResume) {
      defaultResume = await prisma.resume.findFirst();
      if (defaultResume) {
        defaultResume = await prisma.resume.update({
          where: { id: defaultResume.id },
          data: { isDefault: true }
        });
      }
    }

    if (defaultResume) {
      await prisma.profile.upsert({
        where: { id: 1 },
        update: {
          name: defaultResume.personName || '',
          email: defaultResume.email || '',
          phone: defaultResume.phone || '',
          location: defaultResume.location || '',
          summary: defaultResume.summary || '',
          skills: defaultResume.skills || '[]',
          workHistory: defaultResume.workHistory || '[]',
          education: defaultResume.education || '[]',
          certifications: defaultResume.certifications || '[]',
          projects: defaultResume.projects || '[]',
          additionalInfo: defaultResume.additionalInfo || '{}',
          rawResumeText: defaultResume.rawResumeText || '',
        },
        create: {
          id: 1,
          name: defaultResume.personName || '',
          email: defaultResume.email || '',
          phone: defaultResume.phone || '',
          location: defaultResume.location || '',
          summary: defaultResume.summary || '',
          skills: defaultResume.skills || '[]',
          workHistory: defaultResume.workHistory || '[]',
          education: defaultResume.education || '[]',
          certifications: defaultResume.certifications || '[]',
          projects: defaultResume.projects || '[]',
          additionalInfo: defaultResume.additionalInfo || '{}',
          rawResumeText: defaultResume.rawResumeText || '',
        }
      });
      console.log('Successfully synced default resume to legacy profile table at server startup.');
    }
  } catch (err) {
    console.error('Failed to sync legacy profile table at startup:', err);
  }
}
syncOnStartup();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Server is running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});
