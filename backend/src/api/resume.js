const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const prisma = require('../services/db');
const { parseResume } = require('../services/gemini');

// Setup multer storage
const upload = multer({ dest: 'uploads/' });

/**
 * Endpoint to upload and parse PDF/DOCX resumes
 */
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawText = '';

    console.log(`Processing uploaded resume: ${req.file.originalname} (extension: ${ext})`);

    // Parse depending on extension
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
    } else if (ext === '.txt') {
      rawText = fs.readFileSync(filePath, 'utf-8');
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, DOCX, or TXT.' });
    }

    // Clean up temporary uploaded file
    fs.unlinkSync(filePath);

    if (!rawText.trim()) {
      return res.status(400).json({ error: 'Resume file appears to be empty or unreadable.' });
    }

    console.log('Sending extracted text to Gemini API for parsing...');
    const parsedData = await parseResume(rawText);
    console.log('Successfully parsed resume data from Gemini API.');

    // Save or update the single Profile (id = 1) in the DB
    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: {
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        summary: parsedData.summary,
        skills: JSON.stringify(parsedData.skills || []),
        workHistory: JSON.stringify(parsedData.workHistory || []),
        education: JSON.stringify(parsedData.education || []),
        certifications: JSON.stringify(parsedData.certifications || []),
        projects: JSON.stringify(parsedData.projects || []),
        additionalInfo: JSON.stringify(parsedData.additionalInfo || {}),
        rawResumeText: rawText,
      },
      create: {
        id: 1,
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        summary: parsedData.summary,
        skills: JSON.stringify(parsedData.skills || []),
        workHistory: JSON.stringify(parsedData.workHistory || []),
        education: JSON.stringify(parsedData.education || []),
        certifications: JSON.stringify(parsedData.certifications || []),
        projects: JSON.stringify(parsedData.projects || []),
        additionalInfo: JSON.stringify(parsedData.additionalInfo || {}),
        rawResumeText: rawText,
      },
    });

    res.json({
      message: 'Resume parsed and profile updated successfully.',
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills),
        workHistory: JSON.parse(profile.workHistory),
        education: JSON.parse(profile.education),
        certifications: JSON.parse(profile.certifications),
        projects: profile.projects ? JSON.parse(profile.projects) : [],
        additionalInfo: profile.additionalInfo ? JSON.parse(profile.additionalInfo) : {},
      }
    });
  } catch (error) {
    console.error('Error uploading/parsing resume:', error);
    res.status(500).json({ error: 'Failed to process resume: ' + error.message });
  }
});

/**
 * Get current profile
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: 1 },
    });

    if (!profile) {
      return res.status(404).json({ message: 'No profile found. Please upload a resume first.' });
    }

    res.json({
      ...profile,
      skills: JSON.parse(profile.skills || '[]'),
      workHistory: JSON.parse(profile.workHistory || '[]'),
      education: JSON.parse(profile.education || '[]'),
      certifications: JSON.parse(profile.certifications || '[]'),
      projects: JSON.parse(profile.projects || '[]'),
      additionalInfo: JSON.parse(profile.additionalInfo || '{}'),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

/**
 * Manually update profile details
 */
router.put('/profile', async (req, res) => {
  try {
    const { name, email, phone, location, summary, skills, workHistory, education, certifications, projects, additionalInfo } = req.body;

    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: {
        name,
        email,
        phone,
        location,
        summary,
        skills: JSON.stringify(skills || []),
        workHistory: JSON.stringify(workHistory || []),
        education: JSON.stringify(education || []),
        certifications: JSON.stringify(certifications || []),
        projects: JSON.stringify(projects || []),
        additionalInfo: JSON.stringify(additionalInfo || {}),
      },
      create: {
        id: 1,
        name,
        email,
        phone,
        location,
        summary,
        skills: JSON.stringify(skills || []),
        workHistory: JSON.stringify(workHistory || []),
        education: JSON.stringify(education || []),
        certifications: JSON.stringify(certifications || []),
        projects: JSON.stringify(projects || []),
        additionalInfo: JSON.stringify(additionalInfo || {}),
      },
    });

    res.json({
      message: 'Profile updated successfully.',
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills),
        workHistory: JSON.parse(profile.workHistory),
        education: JSON.parse(profile.education),
        certifications: JSON.parse(profile.certifications),
        projects: profile.projects ? JSON.parse(profile.projects) : [],
        additionalInfo: profile.additionalInfo ? JSON.parse(profile.additionalInfo) : {},
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
