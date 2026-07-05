const BACKEND_URL = 'http://127.0.0.1:3001/api';
let currentJob = null;
let currentProfile = null;
let currentTailoredDocs = null;
let activeTabId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const loaderBlock = document.getElementById('loader-block');
  const loaderText = document.getElementById('loader-text');
  const jobDetailsBlock = document.getElementById('job-details-block');
  const highlightsBlock = document.getElementById('highlights-block');
  const skillsBlock = document.getElementById('skills-block');
  const actionsBlock = document.getElementById('actions-block');
  const statusAlert = document.getElementById('status-alert');

  const btnAutofill = document.getElementById('btn-autofill');
  const btnReAnalyze = document.getElementById('btn-re-analyze');

  const clOverlay = document.getElementById('cl-overlay');
  const clTextContainer = document.getElementById('cl-text-container');
  const btnOpenCl = document.getElementById('btn-open-cl');
  const btnCloseCl = document.getElementById('btn-close-cl');
  const btnCopyCl = document.getElementById('btn-copy-cl');
  const btnPdfCl = document.getElementById('btn-pdf-cl');
  const btnDocxCl = document.getElementById('btn-docx-cl');

  const resumeOverlay = document.getElementById('resume-overlay');
  const resumeTextContainer = document.getElementById('resume-text-container');
  const btnOpenResume = document.getElementById('btn-open-resume');
  const btnCloseResume = document.getElementById('btn-close-resume');
  const btnCopyResume = document.getElementById('btn-copy-resume');
  const btnPdfResume = document.getElementById('btn-pdf-resume');
  const btnDocxResume = document.getElementById('btn-docx-resume');

  // Action: Open Resume Preview
  btnOpenResume.addEventListener('click', () => {
    if (!currentTailoredDocs) {
      alert('Resume details are not generated yet.');
      return;
    }
    const tr = currentTailoredDocs.tailoredResume || {};
    let text = `SUMMARY OVERRIDE:\n${tr.summary || ''}\n\n`;
    if (tr.workHistory && tr.workHistory.length > 0) {
      text += `TAILORED EXPERIENCE BULLETS:\n`;
      tr.workHistory.forEach(w => {
        text += `\n${w.company} - ${w.title}:\n`;
        if (w.bullets) {
          w.bullets.forEach(b => {
            text += `• ${b}\n`;
          });
        }
      });
    }
    resumeTextContainer.innerText = text;
    btnPdfResume.href = `${BACKEND_URL}/tailor/${currentJob.id}/download/resume/pdf`;
    btnDocxResume.href = `${BACKEND_URL}/tailor/${currentJob.id}/download/resume/docx`;
    resumeOverlay.style.display = 'flex';
  });

  // Action: Close Resume Preview
  btnCloseResume.addEventListener('click', () => {
    resumeOverlay.style.display = 'none';
  });

  // Action: Copy Resume Text
  btnCopyResume.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(resumeTextContainer.innerText);
      btnCopyResume.innerText = '📋 Copied!';
      setTimeout(() => {
        btnCopyResume.innerText = '📋 Copy';
      }, 1500);
    } catch (err) {
      alert('Failed to copy text: ' + err.message);
    }
  });

  // Action: Open Cover Letter Preview
  btnOpenCl.addEventListener('click', () => {
    if (!currentTailoredDocs) {
      alert('Cover Letter details are not generated yet.');
      return;
    }
    clTextContainer.innerText = currentTailoredDocs.tailoredCoverLetter || '';
    btnPdfCl.href = `${BACKEND_URL}/tailor/${currentJob.id}/download/coverletter/pdf`;
    btnDocxCl.href = `${BACKEND_URL}/tailor/${currentJob.id}/download/coverletter/docx`;
    clOverlay.style.display = 'flex';
  });

  // Action: Close Cover Letter Preview
  btnCloseCl.addEventListener('click', () => {
    clOverlay.style.display = 'none';
  });

  // Action: Copy Cover Letter Text
  btnCopyCl.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(clTextContainer.innerText);
      btnCopyCl.innerText = '📋 Copied!';
      setTimeout(() => {
        btnCopyCl.innerText = '📋 Copy';
      }, 1500);
    } catch (err) {
      alert('Failed to copy text: ' + err.message);
    }
  });

  const manualFormBlock = document.getElementById('manual-form-block');
  const btnEnterManually = document.getElementById('btn-enter-manually');
  const btnCancelManual = document.getElementById('btn-cancel-manual');
  const btnSubmitManual = document.getElementById('btn-submit-manual');

  // Step 1: Query the active tab to extract JD text
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    showError('No active tab found.');
    return;
  }
  activeTabId = tab.id;

  runFullPipeline();

  // Action: Autofill Form Fields
  btnAutofill.addEventListener('click', executeAutofill);

  // Action: Re-Analyze
  btnReAnalyze.addEventListener('click', () => {
    // Reset view
    jobDetailsBlock.style.display = 'none';
    highlightsBlock.style.display = 'none';
    skillsBlock.style.display = 'none';
    actionsBlock.style.display = 'none';
    statusAlert.style.display = 'none';
    manualFormBlock.style.display = 'none';
    
    loaderBlock.style.display = 'flex';
    loaderText.innerText = 'Re-initiating analysis...';
    
    runFullPipeline();
  });

  // Action: Enter Manually
  btnEnterManually.addEventListener('click', showManualForm);

  // Action: Cancel Manual Form
  btnCancelManual.addEventListener('click', () => {
    manualFormBlock.style.display = 'none';
    loaderBlock.style.display = 'flex';
    loaderText.innerText = 'Extracting job description...';
    runFullPipeline();
  });

  // Action: Submit Manual Form
  btnSubmitManual.addEventListener('click', handleManualSubmit);

  function showManualForm() {
    loaderBlock.style.display = 'none';
    jobDetailsBlock.style.display = 'none';
    highlightsBlock.style.display = 'none';
    skillsBlock.style.display = 'none';
    actionsBlock.style.display = 'none';
    statusAlert.style.display = 'none';
    manualFormBlock.style.display = 'flex';
  }

  async function handleManualSubmit() {
    const title = document.getElementById('manual-title').value.trim();
    const company = document.getElementById('manual-company').value.trim();
    const location = document.getElementById('manual-location').value.trim() || 'Remote';
    const description = document.getElementById('manual-description').value.trim();

    if (!title || !company || !description) {
      alert('Please fill out Title, Company, and Job Description.');
      return;
    }

    manualFormBlock.style.display = 'none';
    loaderBlock.style.display = 'flex';
    loaderText.innerText = 'Processing manual job details...';

    try {
      // 2. Fetch Profile to ensure it is uploaded
      loaderText.innerText = 'Checking resume profile...';
      const profRes = await fetch(`${BACKEND_URL}/resume/profile`);
      if (!profRes.ok) {
        throw new Error('Please click "Edit Resume" at the top and upload your master resume first.');
      }
      currentProfile = await profRes.json();

      // Check if job already exists in DB to skip scoring/tailoring
      loaderText.innerText = 'Checking database cache...';
      const jobsRes = await fetch(`${BACKEND_URL}/jobs`);
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        const match = jobs.find(j => 
          j.title.toLowerCase() === title.toLowerCase() && 
          j.company.toLowerCase() === company.toLowerCase()
        );

        if (match && match.fitScore !== null && (match.status === 'Tailored' || match.status === 'Applied')) {
          currentJob = match;
          const docRes = await fetch(`${BACKEND_URL}/tailor/${match.id}`);
          if (docRes.ok) {
            currentTailoredDocs = await docRes.json();
            loaderBlock.style.display = 'none';
            renderResults();
            return;
          }
        }
      }

      // 3. Cache Job Posting to local backend database
      loaderText.innerText = 'Caching job posting details...';
      let currentUrl = 'http://localhost:3000';
      try {
        const currentTab = await chrome.tabs.get(activeTabId);
        currentUrl = currentTab.url || currentUrl;
      } catch (tabErr) {
        console.warn('Failed to query active tab details for URL:', tabErr);
      }

      const saveRes = await fetch(`${BACKEND_URL}/jobs/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          location,
          url: currentUrl,
          description,
          source: 'Manual Extension Entry'
        })
      });
      if (!saveRes.ok) throw new Error('Failed to cache job in backend database.');
      const savedJobData = await saveRes.json();
      const jobId = savedJobData.job.id;

      // 4. Calculate Match Score using Gemini
      loaderText.innerText = 'Gemini is scoring job match...';
      const scoreRes = await fetch(`${BACKEND_URL}/score/${jobId}`, {
        method: 'POST'
      });
      if (!scoreRes.ok) throw new Error('Failed to calculate match score.');
      const scoredJobData = await scoreRes.json();
      currentJob = scoredJobData.job;

      // 5. Tailor Resume & Cover Letter
      loaderText.innerText = 'Gemini is tailoring resume & cover letter...';
      const tailorRes = await fetch(`${BACKEND_URL}/tailor/${jobId}`, {
        method: 'POST'
      });
      if (!tailorRes.ok) throw new Error('Tailoring engine failed.');
      const tailoredData = await tailorRes.json();
      currentTailoredDocs = tailoredData.tailoredDoc;

      // Complete
      loaderBlock.style.display = 'none';
      renderResults();

    } catch (err) {
      showError(err.message);
    }
  }

  async function runFullPipeline() {
    try {
      // 1. Scrape details
      loaderText.innerText = 'Extracting job description...';
      const scrapedJob = await new Promise((resolve) => {
        chrome.tabs.sendMessage(activeTabId, { action: 'getJobDetails' }, (response) => {
          if (chrome.runtime.lastError || !response || !response.title || response.title === 'Job Opportunity') {
            resolve(null);
          } else {
            resolve(response);
          }
        });
      });

      if (!scrapedJob) {
        showManualForm();
        return;
      }

      // 2. Fetch Profile to ensure it is uploaded
      loaderText.innerText = 'Checking resume profile...';
      const profRes = await fetch(`${BACKEND_URL}/resume/profile`);
      if (!profRes.ok) {
        throw new Error('Please click "Edit Resume" at the top and upload your master resume first.');
      }
      currentProfile = await profRes.json();

      // Check if job already exists in DB to skip scoring/tailoring
      loaderText.innerText = 'Checking database cache...';
      const jobsRes = await fetch(`${BACKEND_URL}/jobs`);
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        const match = jobs.find(j => 
          j.title.toLowerCase() === scrapedJob.title.toLowerCase() && 
          j.company.toLowerCase() === scrapedJob.company.toLowerCase()
        );

        if (match && match.fitScore !== null && (match.status === 'Tailored' || match.status === 'Applied')) {
          currentJob = match;
          const docRes = await fetch(`${BACKEND_URL}/tailor/${match.id}`);
          if (docRes.ok) {
            currentTailoredDocs = await docRes.json();
            loaderBlock.style.display = 'none';
            renderResults();
            return;
          }
        }
      }

      // 3. Cache Job Posting to local backend database
      loaderText.innerText = 'Caching job posting details...';
      const saveRes = await fetch(`${BACKEND_URL}/jobs/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scrapedJob.title,
          company: scrapedJob.company,
          location: scrapedJob.location,
          url: scrapedJob.url,
          description: scrapedJob.description,
          source: 'Extension'
        })
      });
      if (!saveRes.ok) throw new Error('Failed to cache job in backend database.');
      const savedJobData = await saveRes.json();
      const jobId = savedJobData.job.id;

      // 4. Calculate Match Score using Gemini
      loaderText.innerText = 'Gemini is scoring job match...';
      const scoreRes = await fetch(`${BACKEND_URL}/score/${jobId}`, {
        method: 'POST'
      });
      if (!scoreRes.ok) throw new Error('Scoring engine failed.');
      const scoredJobData = await scoreRes.json();
      currentJob = scoredJobData.job;

      // 5. Tailor Resume & Cover Letter
      loaderText.innerText = 'Gemini is tailoring resume & cover letter...';
      const tailorRes = await fetch(`${BACKEND_URL}/tailor/${jobId}`, {
        method: 'POST'
      });
      if (!tailorRes.ok) throw new Error('Tailoring engine failed.');
      const tailoredData = await tailorRes.json();
      currentTailoredDocs = tailoredData.tailoredDoc;

      // Hide Loader & Show Result Views
      loaderBlock.style.display = 'none';
      renderResults();

    } catch (err) {
      showError(err.message);
    }
  }

  function renderResults() {
    if (!currentJob) return;

    // 1. Job Card
    jobDetailsBlock.style.display = 'block';
    document.getElementById('job-title').innerText = currentJob.title;
    document.getElementById('job-company').innerText = currentJob.company;
    document.getElementById('job-meta').innerText = currentJob.location || 'Remote';
    
    // Fit Score Badge
    const scoreVal = document.getElementById('score-val');
    scoreVal.innerText = currentJob.fitScore !== null ? `${currentJob.fitScore}%` : '--';
    
    if (currentJob.fitScore >= 80) {
      scoreVal.style.color = '#8b5cf6';
      document.getElementById('score-badge').style.borderColor = '#8b5cf6';
    } else if (currentJob.fitScore >= 60) {
      scoreVal.style.color = '#06b6d4';
      document.getElementById('score-badge').style.borderColor = '#06b6d4';
    } else {
      scoreVal.style.color = '#f97316';
      document.getElementById('score-badge').style.borderColor = '#f97316';
    }

    // 2. Rationale / Key Highlights (split paragraph into sentences)
    highlightsBlock.style.display = 'block';
    const highlightsList = document.getElementById('highlights-list');
    highlightsList.innerHTML = '';
    
    if (currentJob.rationale) {
      const sentences = currentJob.rationale.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      sentences.forEach(sentence => {
        const li = document.createElement('li');
        li.innerText = sentence;
        highlightsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.innerText = 'Analysis successfully logged. Open your dashboard for full score matches.';
      highlightsList.appendChild(li);
    }

    // 3. Skills list
    skillsBlock.style.display = 'block';
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    
    // Matched skills (green pills)
    const matched = currentJob.matchedSkills || [];
    matched.slice(0, 8).forEach(skill => {
      const span = document.createElement('span');
      span.className = 'tag tag-match';
      span.innerText = skill;
      skillsList.appendChild(span);
    });

    // Missing skills (orange pills)
    const missing = currentJob.missingSkills || [];
    missing.slice(0, 8).forEach(skill => {
      const span = document.createElement('span');
      span.className = 'tag tag-missing';
      span.innerText = skill;
      skillsList.appendChild(span);
    });

    // Reveal Action Buttons
    actionsBlock.style.display = 'flex';
  }

  async function executeAutofill() {
    if (!currentProfile || !currentJob) return;
    
    statusAlert.style.display = 'none';

    try {
      const coverLetter = currentTailoredDocs ? currentTailoredDocs.tailoredCoverLetter : '';
      
      // Auto-copy cover letter to clipboard for easy manual pasting
      if (coverLetter) {
        try {
          await navigator.clipboard.writeText(coverLetter);
          console.log('Cover letter copied to clipboard automatically.');
        } catch (clipErr) {
          console.warn('Failed to auto-copy cover letter:', clipErr);
        }
      }

      chrome.tabs.sendMessage(activeTabId, {
        action: 'autofillForm',
        data: {
          profile: currentProfile,
          coverLetter: coverLetter
        }
      }, (response) => {
        if (chrome.runtime.lastError || !response) {
          showStatusMsg('Autofill failed: Connection issues with the active tab.', 'error');
          return;
        }
        showStatusMsg(`Form pre-filled successfully! Tailored Cover Letter copied to clipboard. Highlighted fields in neon cyan.`, 'success');
      });
    } catch (err) {
      showStatusMsg('Autofill execution failed: ' + err.message, 'error');
    }
  }

  function showError(msg) {
    loaderBlock.style.display = 'none';
    statusAlert.style.display = 'block';
    statusAlert.className = 'status-alert status-alert-error';
    statusAlert.innerText = msg;
  }

  function showStatusMsg(msg, type) {
    statusAlert.style.display = 'block';
    statusAlert.className = `status-alert status-alert-${type}`;
    statusAlert.innerText = msg;
  }
});
