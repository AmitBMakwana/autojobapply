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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Server is running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});
