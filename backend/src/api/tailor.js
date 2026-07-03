const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const prisma = require('../services/db');
const { tailorResume, generateCoverLetter } = require('../services/gemini');
const {
  generateResumeDocx,
  generateResumePdf,
  generateCoverLetterDocx,
  generateCoverLetterPdf
} = require('../services/docGenerator');

// Define output directory for generated files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate tailored resume and cover letter for a job
 */
router.post('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: 1 }
    });

    if (!profile) {
      return res.status(400).json({ error: 'No profile found. Please upload a resume first.' });
    }

    const parsedProfile = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      summary: profile.summary,
      skills: JSON.parse(profile.skills || '[]'),
      workHistory: JSON.parse(profile.workHistory || '[]'),
      education: JSON.parse(profile.education || '[]')
    };

    console.log(`Generating tailored resume for job ${jobId}...`);
    const tailoredResumeData = await tailorResume(parsedProfile, job.description);

    console.log(`Generating cover letter for job ${jobId}...`);
    const coverLetterText = await generateCoverLetter(parsedProfile, job.title, job.company, job.description);

    // Save paths
    const resumePdfPath = path.join(OUTPUT_DIR, `${jobId}-resume.pdf`);
    const resumeDocxPath = path.join(OUTPUT_DIR, `${jobId}-resume.docx`);
    const coverLetterPdfPath = path.join(OUTPUT_DIR, `${jobId}-cover-letter.pdf`);
    const coverLetterDocxPath = path.join(OUTPUT_DIR, `${jobId}-cover-letter.docx`);

    // Render files
    console.log('Rendering DOCX and PDF files...');
    await generateResumeDocx(tailoredResumeData, parsedProfile, resumeDocxPath);
    await generateResumePdf(tailoredResumeData, parsedProfile, resumePdfPath);
    await generateCoverLetterDocx(coverLetterText, job, parsedProfile, coverLetterDocxPath);
    await generateCoverLetterPdf(coverLetterText, job, parsedProfile, coverLetterPdfPath);

    // Save TailoredDoc to DB (upsert)
    const tailoredDoc = await prisma.tailoredDoc.upsert({
      where: { jobId },
      update: {
        tailoredResume: JSON.stringify(tailoredResumeData),
        tailoredCoverLetter: coverLetterText,
        resumePdfPath,
        resumeDocxPath,
      },
      create: {
        jobId,
        tailoredResume: JSON.stringify(tailoredResumeData),
        tailoredCoverLetter: coverLetterText,
        resumePdfPath,
        resumeDocxPath,
      }
    });

    // Automatically update job status to 'Tailored' if it is currently 'Saved'
    if (job.status === 'Saved') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'Tailored' }
      });
    }

    res.json({
      message: 'Documents tailored and saved successfully.',
      tailoredDoc: {
        id: tailoredDoc.id,
        jobId: tailoredDoc.jobId,
        tailoredResume: tailoredResumeData,
        tailoredCoverLetter: coverLetterText
      }
    });
  } catch (error) {
    console.error(`Error tailoring documents for job ${req.params.jobId}:`, error);
    res.status(500).json({ error: 'Failed to tailor documents: ' + error.message });
  }
});

/**
 * Retrieve current tailored documents for a job
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const doc = await prisma.tailoredDoc.findUnique({
      where: { jobId }
    });

    if (!doc) {
      return res.status(404).json({ message: 'No tailored documents found for this job.' });
    }

    res.json({
      ...doc,
      tailoredResume: JSON.parse(doc.tailoredResume)
    });
  } catch (error) {
    console.error(`Error retrieving tailored docs for job ${req.params.jobId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
});

/**
 * Download route for tailored resume / cover letter
 */
router.get('/:jobId/download/:docType/:format', async (req, res) => {
  try {
    const { jobId, docType, format } = req.params;

    if (!['resume', 'coverletter'].includes(docType) || !['pdf', 'docx'].includes(format)) {
      return res.status(400).json({ error: 'Invalid document type or format.' });
    }

    const doc = await prisma.tailoredDoc.findUnique({
      where: { jobId }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Tailored documents not found for this job.' });
    }

    let filePath;
    let fileName;

    if (docType === 'resume') {
      filePath = format === 'pdf' ? doc.resumePdfPath : doc.resumeDocxPath;
      fileName = `Tailored_Resume_${jobId}.${format}`;
    } else {
      filePath = path.join(OUTPUT_DIR, `${jobId}-cover-letter.${format}`);
      fileName = `Tailored_Cover_Letter_${jobId}.${format}`;
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found on disk at: ${filePath}` });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document.' });
  }
});

module.exports = router;
