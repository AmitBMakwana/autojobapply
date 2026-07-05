const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const prisma = require('../services/db');
const { parseResume } = require('../services/gemini');

const upload = multer({ dest: 'uploads/' });

/* ─── helpers ─── */
const FIELDS = [
  'personName','email','phone','location','summary',
  'skills','workHistory','education','certifications','projects','additionalInfo'
];

function parseFields(row) {
  if (!row) return null;
  return {
    ...row,
    skills:         JSON.parse(row.skills         || '[]'),
    workHistory:    JSON.parse(row.workHistory     || '[]'),
    education:      JSON.parse(row.education       || '[]'),
    certifications: JSON.parse(row.certifications  || '[]'),
    projects:       JSON.parse(row.projects        || '[]'),
    additionalInfo: JSON.parse(row.additionalInfo  || '{}'),
  };
}

function stringifyFields(body) {
  const data = {};
  if (body.personName     !== undefined) data.personName     = body.personName;
  if (body.email          !== undefined) data.email          = body.email;
  if (body.phone          !== undefined) data.phone          = body.phone;
  if (body.location       !== undefined) data.location       = body.location;
  if (body.summary        !== undefined) data.summary        = body.summary;
  if (body.name           !== undefined) data.name           = body.name;
  if (body.isDefault      !== undefined) data.isDefault      = body.isDefault;
  if (body.skills         !== undefined) data.skills         = JSON.stringify(body.skills         || []);
  if (body.workHistory    !== undefined) data.workHistory    = JSON.stringify(body.workHistory    || []);
  if (body.education      !== undefined) data.education      = JSON.stringify(body.education      || []);
  if (body.certifications !== undefined) data.certifications = JSON.stringify(body.certifications || []);
  if (body.projects       !== undefined) data.projects       = JSON.stringify(body.projects       || []);
  if (body.additionalInfo !== undefined) data.additionalInfo = JSON.stringify(body.additionalInfo || {});
  return data;
}

async function syncToProfile(resume) {
  if (!resume) return;
  // If this resume is default, sync it to Profile table with id: 1
  if (resume.isDefault) {
    await prisma.profile.upsert({
      where: { id: 1 },
      update: {
        name: resume.personName || '',
        email: resume.email || '',
        phone: resume.phone || '',
        location: resume.location || '',
        summary: resume.summary || '',
        skills: resume.skills || '[]',
        workHistory: resume.workHistory || '[]',
        education: resume.education || '[]',
        certifications: resume.certifications || '[]',
        projects: resume.projects || '[]',
        additionalInfo: resume.additionalInfo || '{}',
        rawResumeText: resume.rawResumeText || '',
      },
      create: {
        id: 1,
        name: resume.personName || '',
        email: resume.email || '',
        phone: resume.phone || '',
        location: resume.location || '',
        summary: resume.summary || '',
        skills: resume.skills || '[]',
        workHistory: resume.workHistory || '[]',
        education: resume.education || '[]',
        certifications: resume.certifications || '[]',
        projects: resume.projects || '[]',
        additionalInfo: resume.additionalInfo || '{}',
        rawResumeText: resume.rawResumeText || '',
      }
    });
    console.log('Successfully synced default resume to legacy profile table ID 1.');
  }
}

/* ─── GET /api/resumes ─── List all */
router.get('/', async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json(resumes.map(parseFields));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/resumes ─── Create blank */
router.post('/', async (req, res) => {
  try {
    const count = await prisma.resume.count();
    const resume = await prisma.resume.create({
      data: {
        name: req.body.name || `Resume ${count + 1}`,
        isDefault: count === 0,   // first resume is default automatically
      },
    });
    await syncToProfile(resume);
    res.json(parseFields(resume));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/resumes/:id ─── Get one */
router.get('/:id', async (req, res) => {
  try {
    const resume = await prisma.resume.findUnique({ where: { id: req.params.id } });
    if (!resume) return res.status(404).json({ error: 'Resume not found.' });
    res.json(parseFields(resume));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/resumes/:id ─── Update */
router.put('/:id', async (req, res) => {
  try {
    const data = stringifyFields(req.body);
    const resume = await prisma.resume.update({
      where: { id: req.params.id },
      data,
    });
    await syncToProfile(resume);
    res.json(parseFields(resume));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── DELETE /api/resumes/:id ─── Delete */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.resume.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Resume not found.' });

    await prisma.resume.delete({ where: { id: req.params.id } });

    // If deleted resume was default, set the most recent one as default
    if (existing.isDefault) {
      const next = await prisma.resume.findFirst({ orderBy: { updatedAt: 'desc' } });
      if (next) {
        const updatedNext = await prisma.resume.update({ where: { id: next.id }, data: { isDefault: true } });
        await syncToProfile(updatedNext);
      } else {
        await prisma.profile.deleteMany();
      }
    }

    res.json({ message: 'Resume deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/resumes/:id/duplicate ─── Duplicate */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const source = await prisma.resume.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ error: 'Resume not found.' });

    const { id, createdAt, updatedAt, isDefault, name, ...rest } = source;
    const copy = await prisma.resume.create({
      data: { ...rest, name: `${name} (Copy)`, isDefault: false },
    });
    res.json(parseFields(copy));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/resumes/:id/set-default ─── Set as default */
router.put('/:id/set-default', async (req, res) => {
  try {
    // Clear all defaults
    await prisma.resume.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    // Set new default
    const resume = await prisma.resume.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    });
    await syncToProfile(resume);
    res.json(parseFields(resume));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/resumes/:id/upload ─── Parse PDF/DOCX into this version */
router.post('/:id/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawText = '';

    if (ext === '.pdf') {
      const buf = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buf);
      rawText = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
    } else if (ext === '.txt') {
      rawText = fs.readFileSync(filePath, 'utf-8');
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported format. Use PDF, DOCX, or TXT.' });
    }

    fs.unlinkSync(filePath);

    if (!rawText.trim()) return res.status(400).json({ error: 'File appears empty or unreadable.' });

    const parsed = await parseResume(rawText);

    const resume = await prisma.resume.update({
      where: { id: req.params.id },
      data: {
        personName:     parsed.name     || '',
        email:          parsed.email    || '',
        phone:          parsed.phone    || '',
        location:       parsed.location || '',
        summary:        parsed.summary  || '',
        skills:         JSON.stringify(parsed.skills         || []),
        workHistory:    JSON.stringify(parsed.workHistory    || []),
        education:      JSON.stringify(parsed.education      || []),
        certifications: JSON.stringify(parsed.certifications || []),
        projects:       JSON.stringify(parsed.projects       || []),
        additionalInfo: JSON.stringify(parsed.additionalInfo || {}),
        rawResumeText:  rawText,
      },
    });

    await syncToProfile(resume);

    res.json({ message: 'Resume parsed successfully.', resume: parseFields(resume) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process resume: ' + err.message });
  }
});

module.exports = router;
