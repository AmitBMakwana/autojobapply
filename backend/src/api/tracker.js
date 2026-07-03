const express = require('express');
const router = express.Router();
const prisma = require('../services/db');

/**
 * Get Kanban board data grouped by application status columns
 */
router.get('/board', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: [
        { fitScore: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    const columns = {
      Saved: [],
      Tailored: [],
      Applied: [],
      Interview: [],
      Offer: [],
      Rejected: []
    };

    // Group jobs by status columns
    for (const job of jobs) {
      const parsedJob = {
        ...job,
        matchedSkills: JSON.parse(job.matchedSkills || '[]'),
        missingSkills: JSON.parse(job.missingSkills || '[]')
      };

      if (columns[job.status] !== undefined) {
        columns[job.status].push(parsedJob);
      } else {
        // Fallback for custom statuses
        if (!columns.Saved) columns.Saved = [];
        columns.Saved.push(parsedJob);
      }
    }

    res.json(columns);
  } catch (error) {
    console.error('Error fetching Kanban board columns:', error);
    res.status(500).json({ error: 'Failed to retrieve tracker board columns.' });
  }
});

/**
 * Get application analytics stats
 */
router.get('/stats', async (req, res) => {
  try {
    const totalJobs = await prisma.job.count();
    const saved = await prisma.job.count({ where: { status: 'Saved' } });
    const tailored = await prisma.job.count({ where: { status: 'Tailored' } });
    const applied = await prisma.job.count({ where: { status: 'Applied' } });
    const interviews = await prisma.job.count({ where: { status: 'Interview' } });
    const offers = await prisma.job.count({ where: { status: 'Offer' } });
    const rejections = await prisma.job.count({ where: { status: 'Rejected' } });

    // Calculate average fit score of applied jobs
    const appliedJobs = await prisma.job.findMany({
      where: {
        status: { in: ['Applied', 'Interview', 'Offer'] },
        fitScore: { not: null }
      },
      select: { fitScore: true }
    });

    const avgScore = appliedJobs.length > 0
      ? Math.round(appliedJobs.reduce((sum, j) => sum + j.fitScore, 0) / appliedJobs.length)
      : 0;

    res.json({
      total: totalJobs,
      saved,
      tailored,
      applied,
      interviews,
      offers,
      rejections,
      avgAppliedFitScore: avgScore
    });
  } catch (error) {
    console.error('Error generating application stats:', error);
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

module.exports = router;
