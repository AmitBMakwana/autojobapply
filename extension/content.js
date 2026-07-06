// ============================================================================
// JobForge AI — content.js (v2: passive auto-detect + live panel)
// Injected on every page. Detects a job description, shows a docked side panel,
// scores fit, tailors resume/cover letter with a live section-by-section reveal,
// and assists with autofill. NEVER locates or clicks a host page's Submit/Apply
// button — that action always stays with the user.
// ============================================================================

const API_BASE = 'http://127.0.0.1:3001/api';

// ---- Platform-specific selectors (extend this table as sites change) ------
const SELECTORS = {
  'linkedin.com': {
    title: '.job-details-jobs-unified-top-card__job-title, h1.t-24',
    company: '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name',
    description: '.jobs-description__content, .jobs-box__html-content',
    location: '.job-details-jobs-unified-top-card__primary-description-container'
  },
  'indeed.com': {
    title: 'h1.jobsearch-JobInfoHeader-title',
    company: '[data-testid="inlineHeader-companyName"]',
    description: '#jobDescriptionText',
    location: '[data-testid="inlineHeader-companyLocation"]'
  },
  'naukri.com': {
    title: '.jd-header-title',
    company: '.jd-header-comp-name',
    description: '.job-desc, .dang-inner-html',
    location: '.jd-header-comp-loc'
  },
  'greenhouse.io': {
    title: '.app-title, #header .app-title',
    company: '.company-name',
    description: '#content',
    location: '.location'
  },
  'lever.co': {
    title: '.posting-header h2',
    company: '.main-header-logo img',
    description: '.section.page-centered',
    location: '.posting-categories .location'
  }
};

const GENERIC_FALLBACK = {
  title: 'h1',
  description: 'main, article, [role="main"]'
};

// Never scan your own app, or common non-job sites people keep open in other tabs.
const EXCLUDED_HOSTS = [
  'localhost:3000', 'localhost:3001', '127.0.0.1:3000', '127.0.0.1:3001',
  'google.com', 'mail.google.com', 'accounts.google.com', 'chrome.google.com',
  'claude.ai', 'anthropic.com', 'youtube.com', 'github.com'
];

function isExcludedHost() {
  const host = location.host; // includes port, e.g. "localhost:3000"
  return EXCLUDED_HOSTS.some(h => host === h || host.endsWith('.' + h));
}

// A page only counts as a job posting if it either matches a known platform's
// selectors, OR (for the generic fallback) its text actually reads like a JD.
// Without this, any content-heavy page with an <h1> can false-trigger.
const JD_KEYWORDS = /responsibilities|requirements|qualifications|job description|about the role|what you.?ll do|apply now|years of experience|job type|employment type/i;

// ---- Utilities --------------------------------------------------------------

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function hashString(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function currentSiteConfig() {
  const host = location.hostname.replace('www.', '');
  const match = Object.keys(SELECTORS).find(key => host.includes(key));
  return match ? SELECTORS[match] : null;
}

function textOf(selector) {
  if (!selector) return '';
  const el = document.querySelector(selector);
  return el ? el.innerText.trim() : '';
}

function scrapeJD() {
  const cfg = currentSiteConfig();
  const title = textOf(cfg?.title) || textOf(GENERIC_FALLBACK.title);
  const description = textOf(cfg?.description) || textOf(GENERIC_FALLBACK.description);
  const company = textOf(cfg?.company) || document.querySelector('meta[property="og:site_name"]')?.content || '';
  const location_ = textOf(cfg?.location) || '';

  if (!title || description.length < 200) {
    return { found: false };
  }
  // Known job platforms (matched via SELECTORS) are trusted as-is. Anything
  // relying on the generic fallback must also look like an actual JD.
  if (!cfg && !JD_KEYWORDS.test(description)) {
    return { found: false };
  }
  return {
    found: true,
    title,
    company,
    location: location_,
    description: description.slice(0, 12000), // guard against huge JDs blowing token limits
    url: location.href
  };
}

// ---- Backend calls ------------------------------------------------------------

// fetch() throws a generic "Failed to fetch" TypeError for a whole class of
// different problems (backend not running, wrong port, CORS rejection, DNS
// failure). Wrapping it here lets the UI show something actionable instead of
// a dead end in the console.
async function backendFetch(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    const err = new Error('BACKEND_UNREACHABLE');
    err.cause = networkErr;
    throw err;
  }
  return res;
}

async function saveJobManual(job) {
  const res = await backendFetch(`${API_BASE}/jobs/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job)
  });
  if (!res.ok) throw new Error('save job failed');
  const data = await res.json(); // { message, job: { id, ... } }
  return data.job; // unwrap nested job object so callers get { id, ... } directly
}

async function scoreJob(jobId) {
  const res = await backendFetch(`${API_BASE}/score/${jobId}`, { method: 'POST' });
  if (!res.ok) throw new Error('score failed');
  return res.json(); // { fitScore, matchedSkills, missingSkills, rationale }
}

async function tailorJob(jobId) {
  const res = await backendFetch(`${API_BASE}/tailor/${jobId}`, { method: 'POST' });
  if (!res.ok) {
    if (res.status === 402) throw new Error('OUT_OF_CREDITS');
    throw new Error('tailor failed');
  }
  return res.json(); // { tailoredResume: {summary, workHistory[], skills[]}, tailoredCoverLetter }
}

async function patchJob(jobId, patch) {
  const res = await backendFetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  return res.ok;
}

function downloadUrl(jobId, type, format) {
  return `${API_BASE}/tailor/${jobId}/download/${type}/${format}`;
}

// ---- Panel (Shadow DOM) --------------------------------------------------------

let shadowRoot = null;
let panelState = {
  status: 'idle', // idle | scanning | scored-pending | tailoring | tailored | manual | error
  job: null,
  score: null,
  tailored: null,
  activeTab: 'resume',
  applied: false,
  favorite: false,
  errorDetail: null,
  creditError: false,
  revealed: {}
};

function ensurePanelHost() {
  let hostEl = document.getElementById('jobforge-panel-host');
  if (hostEl) return hostEl.shadowRoot;

  hostEl = document.createElement('div');
  hostEl.id = 'jobforge-panel-host';
  document.documentElement.appendChild(hostEl);
  shadowRoot = hostEl.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = PANEL_STYLES;
  shadowRoot.appendChild(style);

  const container = document.createElement('div');
  container.id = 'jf-container';
  shadowRoot.appendChild(container);

  return shadowRoot;
}

function render() {
  const root = ensurePanelHost();
  const container = root.getElementById('jf-container');
  container.innerHTML = panelTemplate(panelState);
  wireEvents(root);
}

function panelTemplate(state) {
  if (state.status === 'idle' || state.status === 'scanning') {
    return `
      <div class="jf-panel">
        <div class="jf-header"><span class="jf-logo">JobForge<span class="accent">AI</span></span></div>
        <div class="jf-body jf-center">
          <div class="jf-spinner"></div>
          <p class="jf-muted">Looking for a job description on this page...</p>
        </div>
      </div>`;
  }

  if (state.status === 'error') {
    return `
      <div class="jf-panel">
        <div class="jf-header"><span class="jf-logo">JobForge<span class="accent">AI</span></span>
          <button class="jf-close" data-action="close">×</button></div>
        <div class="jf-body">
          <p class="jf-error-title">Can't reach the JobForge backend</p>
          <p class="jf-muted">${escapeHtml(state.errorDetail || 'Request failed.')}</p>
          <p class="jf-muted" style="margin-top:8px">Check that <code>npm run dev</code> is running in <code>backend/</code> on port 3001, then retry.</p>
          <button class="jf-btn jf-btn-primary" style="margin-top:12px" data-action="retry">Retry</button>
        </div>
      </div>`;
  }

  if (state.status === 'manual') {
    return `
      <div class="jf-panel">
        <div class="jf-header"><span class="jf-logo">JobForge<span class="accent">AI</span></span>
          <button class="jf-close" data-action="close">×</button></div>
        <div class="jf-body">
          <p class="jf-muted">Couldn't auto-detect this job.</p>
          <input class="jf-input" id="jf-manual-title" placeholder="Job title" />
          <input class="jf-input" id="jf-manual-company" placeholder="Company" />
          <textarea class="jf-textarea" id="jf-manual-jd" placeholder="Paste job description..."></textarea>
          <button class="jf-btn jf-btn-primary" data-action="submit-manual">Use This Job Description</button>
        </div>
      </div>`;
  }

  const job = state.job || {};
  const score = state.score;

  return `
    <div class="jf-panel">
      <div class="jf-header">
        <span class="jf-logo">JobForge<span class="accent">AI</span></span>
        <button class="jf-close" data-action="close">×</button>
      </div>
      <div class="jf-body">
        <div class="jf-jobtitle">${escapeHtml(job.title || '')}</div>
        <div class="jf-company">${escapeHtml(job.company || '')} ${job.location ? '· ' + escapeHtml(job.location) : ''}</div>

        ${score ? `
          <div class="jf-score-badge">
            <div class="jf-score-num">${score.fitScore}</div>
            <div class="jf-score-label">MATCH SCORE</div>
          </div>
          ${score.matchedSkills?.length ? `
            <div class="jf-section-label">Skills</div>
            <div class="jf-tags">${score.matchedSkills.map(s => `<span class="jf-tag jf-tag-good">✓ ${escapeHtml(s)}</span>`).join('')}</div>
          ` : ''}
          ${score.rationale ? `<div class="jf-section-label">Key Highlights</div><div class="jf-highlight">${escapeHtml(score.rationale)}</div>` : ''}
        ` : `<div class="jf-muted" style="margin-top:12px">Scoring your fit...</div>`}

        <div class="jf-tabs">
          <button class="jf-tab ${state.activeTab === 'resume' ? 'active' : ''}" data-action="tab-resume">Resume</button>
          <button class="jf-tab ${state.activeTab === 'cover' ? 'active' : ''}" data-action="tab-cover">Cover Letter</button>
        </div>

        <div class="jf-tabcontent" id="jf-tabcontent">
          ${renderTabContent(state)}
        </div>

        <div class="jf-actions">
          ${!state.tailored ? `<button class="jf-btn jf-btn-primary" data-action="tailor" ${(state.status === 'tailoring' || state.status === 'scoring') ? 'disabled' : ''}>
              ${state.status === 'tailoring' ? 'Tailoring...' : state.status === 'scoring' ? 'Scoring...' : 'Tailor Resume'}
            </button>` : `
            <button class="jf-btn jf-btn-primary" data-action="download">Download</button>
            <button class="jf-btn" data-action="autofill">Autofill Form</button>
          `}
        </div>

        <div class="jf-footer">
          <label class="jf-checkbox"><input type="checkbox" data-action="toggle-fav" ${state.favorite ? 'checked' : ''}/> Favorite</label>
          <label class="jf-checkbox"><input type="checkbox" data-action="toggle-applied" ${state.applied ? 'checked' : ''}/> Mark as Applied</label>
        </div>
        <button class="jf-btn jf-btn-ghost jf-reload" data-action="reload">↻ Reload Job Details</button>
      </div>
    </div>`;
}

function renderTabContent(state) {
  if (state.status === 'tailoring') {
    return `<div class="jf-center" style="padding:24px 0"><div class="jf-spinner"></div><p class="jf-muted">${state.streamLabel || 'Generating AI suggestions...'}</p></div>`;
  }
  if (!state.tailored) {
    return `<p class="jf-muted">Click "Tailor Resume" to generate a version optimized for this job.</p>`;
  }
  if (state.activeTab === 'resume') {
    const r = state.tailored.tailoredResume || {};
    return `
      <div class="jf-doc-section ${state.revealed?.summary ? 'jf-revealed' : 'jf-hidden'}">
        <strong>Summary</strong><p>${escapeHtml(r.summary || '')}</p>
      </div>
      <div class="jf-doc-section ${state.revealed?.skills ? 'jf-revealed' : 'jf-hidden'}">
        <strong>Skills</strong><p>${(r.skills || []).map(escapeHtml).join(', ')}</p>
      </div>
      <div class="jf-doc-section ${state.revealed?.experience ? 'jf-revealed' : 'jf-hidden'}">
        <strong>Experience</strong>
        ${(r.workHistory || []).map(w => `
          <div class="jf-workitem">
            <div class="jf-workhead">${escapeHtml(w.title || '')} — ${escapeHtml(w.company || '')}</div>
            <ul>${(w.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>`;
  }
  return `<div class="jf-doc-section jf-revealed"><p>${escapeHtml(state.tailored.tailoredCoverLetter || '').replace(/\n/g, '<br/>')}</p></div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---- Event wiring ------------------------------------------------------------

function wireEvents(root) {
  root.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', onAction);
  });
  root.querySelectorAll('input[type=checkbox][data-action]').forEach(el => {
    el.addEventListener('change', onToggle);
  });
}

async function onAction(e) {
  const action = e.currentTarget.dataset.action;
  const root = shadowRoot;

  if (action === 'close') {
    document.getElementById('jobforge-panel-host')?.remove();
    return;
  }

  if (action === 'tab-resume') { panelState.activeTab = 'resume'; render(); return; }
  if (action === 'tab-cover') { panelState.activeTab = 'cover'; render(); return; }

  if (action === 'retry') {
    panelState.status = 'scanning';
    render();
    runDetectionCycle(true);
    return;
  }

  if (action === 'reload') {
    panelState = { ...panelState, status: 'scanning', tailored: null, score: null };
    render();
    runDetectionCycle(true);
    return;
  }

  if (action === 'submit-manual') {
    const title = root.getElementById('jf-manual-title').value.trim();
    const company = root.getElementById('jf-manual-company').value.trim();
    const description = root.getElementById('jf-manual-jd').value.trim();
    if (!title || description.length < 50) return;
    await startJobFlow({ found: true, title, company, description, location: '', url: location.href });
    return;
  }

  if (action === 'tailor') {
    await runTailoring();
    return;
  }

  if (action === 'download') {
    const jobId = panelState.job.id;
    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url: downloadUrl(jobId, 'resume', 'docx'),
      filename: `resume-${jobId}.docx`
    });
    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url: downloadUrl(jobId, 'cover-letter', 'docx'),
      filename: `cover-letter-${jobId}.docx`
    });
    return;
  }

  if (action === 'autofill') {
    autofillForm(panelState.tailored);
    return;
  }
}

async function onToggle(e) {
  const action = e.currentTarget.dataset.action;
  const jobId = panelState.job?.id;
  if (!jobId) return;

  if (action === 'toggle-fav') {
    panelState.favorite = e.currentTarget.checked;
    await patchJob(jobId, { favorite: panelState.favorite });
  }
  if (action === 'toggle-applied') {
    panelState.applied = e.currentTarget.checked;
    await patchJob(jobId, { status: panelState.applied ? 'Applied' : 'Saved', appliedDate: panelState.applied ? new Date().toISOString() : null });
    if (panelState.applied) {
      chrome.runtime.sendMessage({ action: 'notify', title: 'Marked as Applied', message: `${panelState.job.title} at ${panelState.job.company}` });
    }
  }
}

// ---- Core flow ------------------------------------------------------------

async function startJobFlow(jd) {
  try {
    // Step 1: Render job card IMMEDIATELY from scraped data — no network call needed.
    // User sees the panel in ~250 ms (debounce) + DOM scrape time.
    panelState = {
      ...panelState,
      status: 'scoring',  // job card visible; score badge shows "Scoring your fit..."
      job: { id: null, title: jd.title, company: jd.company || 'Unknown', location: jd.location },
      score: null,
      tailored: null
    };
    render();

    // Step 2: Save to backend (fast — just a DB write)
    const saved = await saveJobManual({
      title: jd.title, company: jd.company || 'Unknown', location: jd.location,
      description: jd.description, url: jd.url, source: 'Extension'
    });
    const jobId = saved.id;
    panelState.job = { ...panelState.job, id: jobId };

    // Step 3: Score in background — panel already visible, this just updates the badge
    const score = await scoreJob(jobId);
    panelState.score = score;
    panelState.status = 'scored';  // falls through to job card template with score
    render();

    chrome.runtime.sendMessage({ action: 'setBadge', text: '●' });
  } catch (err) {
    console.error('[JobForge] flow error', err);
    if (err.message === 'BACKEND_UNREACHABLE') {
      panelState.status = 'error';
      panelState.errorDetail = `Couldn't connect to ${API_BASE}. Is the backend running?`;
    } else {
      panelState.status = 'error';
      panelState.errorDetail = err.message || 'Unknown error.';
    }
    render();
  }
}

async function runTailoring() {
  panelState.status = 'tailoring';
  panelState.streamLabel = 'Preparing resume data...';
  panelState.revealed = {};
  render();

  try {
    // Simulated progressive reveal while waiting on the real (non-streaming) call.
    // If/when the backend adds :streamGenerateContent support, replace this timer
    // sequence with real chunk handling from an SSE/fetch-stream response.
    const revealSteps = [
      { key: 'summary', label: 'Rewriting your summary...', delay: 600 },
      { key: 'skills', label: 'Matching keywords...', delay: 900 },
      { key: 'experience', label: 'Optimizing experience bullets...', delay: 1200 }
    ];

    const tailorPromise = tailorJob(panelState.job.id);

    for (const step of revealSteps) {
      await new Promise(r => setTimeout(r, step.delay));
      panelState.streamLabel = step.label;
      render();
    }

    const result = await tailorPromise;
    panelState.tailored = result;
    panelState.status = 'tailored';

    // Reveal sections in sequence for the "live edit" effect
    for (const key of ['summary', 'skills', 'experience']) {
      panelState.revealed[key] = true;
      render();
      await new Promise(r => setTimeout(r, 300));
    }

    chrome.runtime.sendMessage({
      action: 'notify',
      title: 'Resume tailored',
      message: `${panelState.job.title} at ${panelState.job.company} — ${panelState.score?.fitScore ?? ''}% match`
    });
  } catch (err) {
    if (err.message === 'OUT_OF_CREDITS') {
      panelState.status = 'idle';
      panelState.creditError = true;
    } else {
      console.error('[JobForge] tailor error', err);
      panelState.status = 'idle';
    }
    render();
  }
}

async function autofillForm(tailored) {
  // Fetch the real profile from the backend so we have name/email/phone/location
  let profile = {};
  try {
    const res = await fetch(`${API_BASE}/resume/profile`);
    if (res.ok) profile = await res.json();
  } catch (e) {
    console.warn('[JobForge] Could not fetch profile for autofill', e);
  }

  const fieldMap = [
    // Name — first try full name, then given-name
    { selectors: ['input[autocomplete="name"]', 'input[name*=name i]', 'input[id*=name i]', 'input[placeholder*=name i]'],
      value: () => profile.name },
    // Email
    { selectors: ['input[autocomplete="email"]', 'input[type=email]', 'input[name*=email i]', 'input[id*=email i]', 'input[placeholder*=email i]'],
      value: () => profile.email },
    // Phone
    { selectors: ['input[autocomplete="tel"]', 'input[type=tel]', 'input[name*=phone i]', 'input[id*=phone i]', 'input[placeholder*=phone i]'],
      value: () => profile.phone },
    // Location / city
    { selectors: ['input[autocomplete="address-level2"]', 'input[name*=location i]', 'input[name*=city i]', 'input[id*=location i]', 'input[placeholder*=location i]', 'input[placeholder*=city i]'],
      value: () => profile.location },
    // Cover letter textarea
    { selectors: ['textarea[name*=cover i]', 'textarea[id*=cover i]', 'textarea[placeholder*=cover i]', 'textarea[placeholder*=letter i]'],
      value: () => tailored?.tailoredCoverLetter }
  ];

  let filledCount = 0;

  fieldMap.forEach(({ selectors, value }) => {
    const val = value();
    if (!val) return;
    const el = selectors.map(s => document.querySelector(s)).find(Boolean);
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.style.outline = '2px solid #06b6d4';
      el.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
      filledCount++;
    }
  });

  // Highlight file upload inputs so the user knows where to drag the resume
  document.querySelectorAll('input[type=file]').forEach(el => {
    el.style.outline = '2px dashed #a855f7';
    el.title = 'Upload your JobForge tailored resume here';
  });

  // Intentionally does NOT search for or click any submit/apply button.
  chrome.runtime.sendMessage({
    action: 'notify',
    title: 'Autofill complete',
    message: `Filled ${filledCount} field(s). Upload your tailored resume and submit manually.`
  });
}

// ---- Detection loop ------------------------------------------------------------

let lastHash = null;

async function runDetectionCycle(force = false) {
  if (isExcludedHost()) return;

  const jd = scrapeJD();

  if (!jd.found) {
    if (force) {
      panelState.status = 'manual';
      render();
    }
    return;
  }

  const hash = await hashString(jd.title + jd.company + jd.description.slice(0, 500));
  if (hash === lastHash && !force) return;
  lastHash = hash;

  await startJobFlow(jd);
}

const debouncedScan = debounce(() => runDetectionCycle(false), 250);

// Initial scan
debouncedScan();

// Watch for SPA navigation (LinkedIn/Indeed/Naukri don't do full page reloads)
new MutationObserver(debouncedScan).observe(document.body, { childList: true, subtree: true });

let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    debouncedScan();
  }
}, 1000);

// ---- Styles (scoped inside shadow root) ------------------------------------------

const PANEL_STYLES = `
:host {
  all: initial;
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  z-index: 2147483647 !important;
  display: block !important;
}
.jf-panel {
  width: 360px;
  height: 100vh;
  background: #0a0a0f;
  color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(255,255,255,0.08);
  box-shadow: -8px 0 32px rgba(0,0,0,0.6);
  overflow: hidden;
}
.jf-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(168,85,247,0.06);
  flex-shrink: 0;
}
.jf-logo { font-weight: 700; font-size: 15px; color: #fff; }
.jf-logo .accent { color: #a855f7; }
.jf-close {
  background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;
  line-height: 1; width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.jf-close:hover { background: rgba(255,255,255,0.08); color: #fff; }
.jf-body { padding: 16px; overflow-y: auto; flex: 1; }
.jf-center { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; }
.jf-muted { color: #9ca3af; font-size: 12px; line-height: 1.5; }
.jf-error-title { color: #f87171; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
.jf-body code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
.jf-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(168,85,247,0.15);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: jf-spin 0.75s linear infinite;
}
@keyframes jf-spin { to { transform: rotate(360deg); } }
.jf-jobtitle { font-size: 15px; font-weight: 600; color: #fff; line-height: 1.3; }
.jf-company { color: #9ca3af; margin-top: 3px; margin-bottom: 14px; font-size: 12px; }
.jf-score-badge {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25);
  border-radius: 12px; padding: 12px; margin-bottom: 12px;
}
.jf-score-num { font-size: 30px; font-weight: 800; color: #a855f7; line-height: 1; }
.jf-score-label { font-size: 10px; letter-spacing: 0.1em; color: #9ca3af; margin-top: 4px; text-transform: uppercase; }
.jf-section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin: 10px 0 6px; }
.jf-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.jf-tag { padding: 3px 8px; border-radius: 999px; font-size: 11px; border: 1px solid rgba(255,255,255,0.1); }
.jf-tag-good { color: #34d399; border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.06); }
.jf-highlight { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px 12px; line-height: 1.5; font-size: 12px; color: #d1d5db; }
.jf-tabs { display: flex; gap: 4px; margin-top: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.jf-tab { flex: 1; background: none; border: none; color: #9ca3af; padding: 8px; cursor: pointer; border-bottom: 2px solid transparent; font-size: 13px; transition: color 0.15s; }
.jf-tab:hover { color: #d1d5db; }
.jf-tab.active { color: #fff; border-bottom-color: #a855f7; }
.jf-tabcontent { padding: 12px 0; min-height: 120px; }
.jf-doc-section { margin-bottom: 14px; transition: opacity 0.35s ease, transform 0.35s ease; }
.jf-doc-section.jf-hidden { opacity: 0.1; transform: translateY(4px); }
.jf-doc-section.jf-revealed { opacity: 1; transform: translateY(0); }
.jf-doc-section strong { color: #e5e7eb; display: block; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
.jf-doc-section p, .jf-doc-section li { font-size: 12px; color: #d1d5db; line-height: 1.5; }
.jf-doc-section ul { margin: 0; padding-left: 16px; }
.jf-workitem { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.jf-workitem:last-child { border-bottom: none; }
.jf-workhead { font-weight: 600; color: #e5e7eb; font-size: 12px; margin-bottom: 4px; }
.jf-actions { display: flex; gap: 8px; margin-top: 10px; }
.jf-btn {
  flex: 1; padding: 10px 12px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04); color: #e5e7eb;
  cursor: pointer; font-size: 13px; font-weight: 500;
  transition: background 0.15s, border-color 0.15s;
}
.jf-btn:hover { background: rgba(255,255,255,0.08); }
.jf-btn-primary { background: linear-gradient(135deg,#7c3aed,#a855f7); border-color: rgba(168,85,247,0.5); color: #fff; font-weight: 600; }
.jf-btn-primary:hover { background: linear-gradient(135deg,#6d28d9,#9333ea); }
.jf-btn-primary:disabled { opacity: 0.5; cursor: default; }
.jf-btn-ghost { background: none; border: none; color: #6b7280; margin-top: 10px; width: 100%; font-size: 12px; }
.jf-btn-ghost:hover { color: #9ca3af; }
.jf-footer { display: flex; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #d1d5db; }
.jf-checkbox { display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }
.jf-input, .jf-textarea {
  width: 100%; box-sizing: border-box;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; border-radius: 8px; padding: 10px 12px;
  margin-bottom: 8px; font-family: inherit; font-size: 13px;
  transition: border-color 0.15s;
}
.jf-input:focus, .jf-textarea:focus { outline: none; border-color: rgba(168,85,247,0.5); }
.jf-textarea { min-height: 130px; resize: vertical; }
`;