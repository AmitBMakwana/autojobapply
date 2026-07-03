const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { scoreJob } = require('../services/gemini');

/**
 * Score/Re-score a job description against the profile
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
      return res.status(400).json({ error: 'Please upload a resume profile first.' });
    }

    const parsedProfile = {
      name: profile.name,
      summary: profile.summary,
      skills: JSON.parse(profile.skills || '[]'),
      workHistory: JSON.parse(profile.workHistory || '[]')
    };

    console.log(`Manually scoring job ${jobId} against profile...`);
    const scoreResult = await scoreJob(parsedProfile, job.description);

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        fitScore: scoreResult.fitScore,
        matchedSkills: JSON.stringify(scoreResult.matchedSkills || []),
        missingSkills: JSON.stringify(scoreResult.missingSkills || []),
        rationale: scoreResult.rationale
      }
    });

    res.json({
      message: 'Job scored successfully.',
      job: {
        ...updatedJob,
        matchedSkills: JSON.parse(updatedJob.matchedSkills || '[]'),
        missingSkills: JSON.parse(updatedJob.missingSkills || '[]')
      }
    });
  } catch (error) {
    console.error(`Error scoring job ${req.params.jobId}:`, error);
    res.status(500).json({ error: 'Failed to score job: ' + error.message });
  }
});

module.exports = router;
