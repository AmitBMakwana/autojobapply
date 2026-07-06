const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { aggregateJobs } = require('../services/aggregator');
const { scoreJob } = require('../services/gemini');

/**
 * Trigger job aggregation and auto-scoring
 */
router.post('/trigger-aggregation', async (req, res) => {
  try {
    // Get search criteria from request, fallback to profile preferences or generic
    let { title, location } = req.body;

    const profile = await prisma.profile.findUnique({ where: { id: 1 } });
    
    if (!title && profile) {
      // Guess target job from profile summary or raw resume
      // For simplicity, use profile name or first title in history
      const history = JSON.parse(profile.workHistory || '[]');
      if (history.length > 0) {
        title = history[0].title;
      }
      if (!location) {
        location = profile.location;
      }
    }

    if (!title) {
      title = 'Software Engineer'; // general fallback
    }

    console.log(`Aggregating jobs for target: "${title}" in "${location || 'Remote'}"`);
    const jobs = await aggregateJobs(title, location);
    
    let addedCount = 0;
    let scoredCount = 0;

    for (const job of jobs) {
      // Check if job exists in DB
      const existingJob = await prisma.job.findUnique({
        where: { id: job.id }
      });

      if (!existingJob) {
        addedCount++;
        
        let fitScore = null;
        let matchedSkills = '[]';
        let missingSkills = '[]';
        let rationale = null;

        // Auto-score the job if a profile exists
        if (profile && job.description) {
          try {
            const parsedProfile = {
              name: profile.name,
              summary: profile.summary,
              skills: JSON.parse(profile.skills || '[]'),
              workHistory: JSON.parse(profile.workHistory || '[]')
            };

            console.log(`Auto-scoring new job: ${job.title} at ${job.company}`);
            const scoreResult = await scoreJob(parsedProfile, job.description);
            
            fitScore = scoreResult.fitScore;
            matchedSkills = JSON.stringify(scoreResult.matchedSkills || []);
            missingSkills = JSON.stringify(scoreResult.missingSkills || []);
            rationale = scoreResult.rationale;
            scoredCount++;
          } catch (scoreErr) {
            console.error(`Failed to auto-score job ${job.id}:`, scoreErr.message);
          }
        }

        await prisma.job.create({
          data: {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            description: job.description,
            source: job.source,
            fitScore,
            matchedSkills,
            missingSkills,
            rationale,
            status: 'Saved'
          }
        });
      }
    }

    res.json({
      message: `Aggregation complete. Processed ${jobs.length} jobs.`,
      addedCount,
      scoredCount
    });
  } catch (error) {
    console.error('Job aggregation failed:', error);
    res.status(500).json({ error: 'Failed to aggregate jobs: ' + error.message });
  }
});

/**
 * Retrieve all jobs
 */
router.get('/', async (req, res) => {
  try {
    const { status, minScore } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    if (minScore) {
      where.fitScore = {
        gte: parseInt(minScore, 10)
      };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: [
        { fitScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedJobs = jobs.map(job => ({
      ...job,
      matchedSkills: JSON.parse(job.matchedSkills || '[]'),
      missingSkills: JSON.parse(job.missingSkills || '[]')
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs.' });
  }
});

/**
 * Update job status or details
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fitScore, matchedSkills, missingSkills, rationale, appliedDate } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (fitScore !== undefined) updateData.fitScore = fitScore;
    if (matchedSkills !== undefined) updateData.matchedSkills = JSON.stringify(matchedSkills);
    if (missingSkills !== undefined) updateData.missingSkills = JSON.stringify(missingSkills);
    if (rationale !== undefined) updateData.rationale = rationale;
    if (appliedDate !== undefined) updateData.appliedDate = appliedDate ? new Date(appliedDate) : null;

    const job = await prisma.job.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Job updated successfully.',
      job: {
        ...job,
        matchedSkills: JSON.parse(job.matchedSkills || '[]'),
        missingSkills: JSON.parse(job.missingSkills || '[]')
      }
    });
  } catch (error) {
    console.error(`Error updating job ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update job.' });
  }
});

/**
 * Manually add a job posting (primarily used by Chrome extension)
 */
router.post('/manual', async (req, res) => {
  try {
    const { id, title, company, location, url, description, source } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const resolvedCompany = company || 'Unknown';
    const jobKey = id || `manual-${resolvedCompany.toLowerCase()}-${title.toLowerCase()}-${Date.now()}`;

    // Check if exists
    let job = await prisma.job.findUnique({
      where: { id: jobKey }
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          id: jobKey,
          title,
          company: resolvedCompany,
          location: location || 'Unknown',
          url,
          description: description || '',
          source: source || 'Manual',
          status: 'Saved'
        }
      });
    }

    res.json({
      message: 'Job saved successfully.',
      job: {
        ...job,
        matchedSkills: JSON.parse(job.matchedSkills || '[]'),
        missingSkills: JSON.parse(job.missingSkills || '[]')
      }
    });
  } catch (error) {
    console.error('Error adding job manually:', error);
    res.status(500).json({ error: 'Failed to add job.' });
  }
});

module.exports = router;
