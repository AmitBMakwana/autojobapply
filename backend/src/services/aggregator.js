const dotenv = require('dotenv');
dotenv.config();

// List of popular tech companies using Greenhouse and Lever to query by default
const GREENHOUSE_COMPANIES = ['stripe', 'cloudflare', 'okta', 'hubspot', 'snapchat', 'pinterest'];
const LEVER_COMPANIES = ['lever', 'vercel', 'spotify', 'figma', 'deliveroo', 'deriv'];

/**
 * Fetch jobs from Greenhouse Public APIs for predefined companies
 */
async function fetchGreenhouseJobs(query, location) {
  const jobsList = [];
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`);
      if (!response.ok) continue;
      const data = await response.json();
      
      if (data && data.jobs) {
        for (const job of data.jobs) {
          const titleMatches = searchTerms.some(term => job.title.toLowerCase().includes(term));
          const locationMatches = !location || job.location?.name?.toLowerCase().includes(location.toLowerCase());
          
          if (titleMatches && locationMatches) {
            jobsList.push({
              id: `greenhouse-${company}-${job.id}`,
              title: job.title,
              company: company.charAt(0).toUpperCase() + company.slice(1),
              location: job.location?.name || 'Remote',
              url: job.absolute_url,
              description: job.content || 'Please see application link for details.',
              source: 'Greenhouse'
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch Greenhouse jobs for ${company}:`, err.message);
    }
  }
  return jobsList;
}

/**
 * Fetch jobs from Lever Public APIs for predefined companies
 */
async function fetchLeverJobs(query, location) {
  const jobsList = [];
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  for (const company of LEVER_COMPANIES) {
    try {
      const response = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
      if (!response.ok) continue;
      const data = await response.json();
      
      if (Array.isArray(data)) {
        for (const job of data) {
          const titleMatches = searchTerms.some(term => job.title.toLowerCase().includes(term));
          const locationMatches = !location || job.categories?.location?.toLowerCase().includes(location.toLowerCase());
          
          if (titleMatches && locationMatches) {
            jobsList.push({
              id: `lever-${company}-${job.id}`,
              title: job.title,
              company: company.charAt(0).toUpperCase() + company.slice(1),
              location: job.categories?.location || 'Remote',
              url: job.hostedUrl,
              description: `${job.description}\n\n${job.lists?.map(l => `### ${l.text}\n${l.content}`).join('\n')}`,
              source: 'Lever'
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch Lever jobs for ${company}:`, err.message);
    }
  }
  return jobsList;
}

/**
 * Fetch jobs from Adzuna API
 */
async function fetchAdzunaJobs(query, location) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) {
    console.log('Adzuna API credentials not configured. Skipping Adzuna search.');
    return [];
  }

  const jobsList = [];
  try {
    // Default country to US, fallback location query parameter
    const country = 'us';
    const where = location ? encodeURIComponent(location) : '';
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(query)}&where=${where}&content-type=application/json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.results) {
      for (const job of data.results) {
        jobsList.push({
          id: `adzuna-${job.id}`,
          title: job.title,
          company: job.company?.display_name || 'Unknown Company',
          location: job.location?.display_name || 'Remote',
          url: job.redirect_url,
          description: job.description || 'Details inside.',
          source: 'Adzuna'
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Adzuna jobs:', err.message);
  }
  return jobsList;
}

/**
 * Fetch jobs from JSearch (RapidAPI)
 */
async function fetchJSearchJobs(query, location) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    console.log('RapidAPI key not configured. Skipping JSearch.');
    return [];
  }

  const jobsList = [];
  try {
    const searchQuery = `${query} in ${location || 'anywhere'}`;
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.data) {
      for (const job of data.data) {
        jobsList.push({
          id: `jsearch-${job.job_id}`,
          title: job.job_title,
          company: job.employer_name || 'Unknown Company',
          location: `${job.job_city ? job.job_city + ', ' : ''}${job.job_state || ''} ${job.job_country || ''}`.trim() || 'Remote',
          url: job.job_apply_link || job.job_google_link,
          description: job.job_description || 'Details inside.',
          source: 'JSearch'
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch JSearch jobs:', err.message);
  }
  return jobsList;
}

/**
 * Aggregate jobs from all sources and return clean deduped array
 */
async function aggregateJobs(query, location) {
  console.log(`Starting job aggregation for query: "${query}", location: "${location}"...`);
  
  const [gh, lever, adzuna, jsearch] = await Promise.all([
    fetchGreenhouseJobs(query, location),
    fetchLeverJobs(query, location),
    fetchAdzunaJobs(query, location),
    fetchJSearchJobs(query, location)
  ]);

  const allJobs = [...gh, ...lever, ...adzuna, ...jsearch];
  
  // Deduplicate by lowercased title + company + location
  const seen = new Set();
  const dedupedJobs = [];
  
  for (const job of allJobs) {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${(job.location || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedJobs.push(job);
    }
  }

  console.log(`Aggregation complete. Found ${allJobs.length} raw jobs, deduped to ${dedupedJobs.length} jobs.`);
  return dedupedJobs;
}

module.exports = {
  aggregateJobs
};
