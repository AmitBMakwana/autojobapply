# BRAIN.md — JobForge AI: Single Source of Truth

> **Last updated:** 2026-07-07  
> **Purpose:** Complete reverse-engineered knowledge base. Any AI agent or developer must read this before touching any part of the project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Database Schema](#4-database-schema)
5. [Backend Deep-Dive](#5-backend-deep-dive)
6. [Chrome Extension Deep-Dive](#6-chrome-extension-deep-dive)
7. [Dashboard Deep-Dive](#7-dashboard-deep-dive)
8. [Data Flow: End-to-End Workflows](#8-data-flow-end-to-end-workflows)
9. [Environment Variables](#9-environment-variables)
10. [Startup Guide](#10-startup-guide)
11. [Security Analysis](#11-security-analysis)
12. [Technical Debt & Known Issues](#12-technical-debt--known-issues)
13. [Dependency Map](#13-dependency-map)
14. [Performance Considerations](#14-performance-considerations)
15. [Failure Modes](#15-failure-modes)
16. [Conventions](#16-conventions)
17. [Adding New Features](#17-adding-new-features)
18. [Quick Diagnostics Checklist](#18-quick-diagnostics-checklist)

---

## 1. Project Overview

**JobForge AI** is a local-first, AI-powered job-application automation suite. It helps job seekers find, score, tailor, and track job applications. The system has three independently deployed components that work together:

| Component | Tech | Port | Purpose |
|---|---|---|---|
| **Backend** | Node.js + Express | 3001 | REST API, AI orchestration, DB, file generation |
| **Dashboard** | Next.js 16 (App Router) | 3000 | Web UI for managing jobs, resumes, and tracker |
| **Extension** | Chrome MV3 | N/A | In-browser job detection, scoring, tailoring, autofill |

All three components point to the **same local backend at `http://127.0.0.1:3001`**. There is no cloud hosting, authentication server, or message broker. Everything runs on the developer's machine.

---

## 2. Repository Structure

```
autojobapply/
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── index.js          # Entry point, middleware, route registration, startup sync
│   │   ├── api/              # Route handlers (one file per domain)
│   │   │   ├── resume.js     # Legacy single-profile upload + CRUD
│   │   │   ├── resumes.js    # Multi-version resume management
│   │   │   ├── jobs.js       # Job CRUD + aggregation trigger
│   │   │   ├── score.js      # AI fit-scoring endpoint
│   │   │   ├── tailor.js     # AI resume/cover-letter generation + download
│   │   │   ├── tracker.js    # Kanban board + analytics stats
│   │   │   └── settings.js   # API key management (file-backed)
│   │   └── services/
│   │       ├── db.js         # Prisma client singleton
│   │       ├── gemini.js     # All Gemini API calls (parse/score/tailor/cover)
│   │       ├── aggregator.js # Job aggregation from 4 sources
│   │       └── docGenerator.js # DOCX + PDF generation (docx + pdfkit)
│   ├── output/               # Generated DOCX/PDF files (not committed)
│   ├── uploads/              # Temp multer upload storage (auto-cleaned per request)
│   ├── settings.json         # Runtime API key overrides (created on first settings save)
│   └── .env                  # Environment variables
├── prisma/
│   ├── schema.prisma         # DB schema (SQLite, 4 models)
│   └── dev.db                # SQLite database file
├── dashboard/                # Next.js 16 web app
│   ├── app/
│   │   ├── layout.js         # Root layout (Navbar + ClientLayoutWrapper)
│   │   ├── page.js           # Home: marketing landing OR logged-in dashboard
│   │   ├── jobs/page.js      # Jobs board with aggregation + tailoring
│   │   ├── tracker/page.js   # Kanban + list view application tracker
│   │   ├── profile/page.js   # Resume profile editor
│   │   ├── settings/page.js  # API key settings UI
│   │   ├── login/page.js     # Fake login (localStorage only)
│   │   ├── signup/page.js    # Fake signup (localStorage only)
│   │   └── upgrade/page.js   # Placeholder upgrade/pricing page
│   ├── components/
│   │   ├── Navbar.js         # Top nav bar (hidden on logged-out routes)
│   │   └── ClientLayoutWrapper.js # Auth guard + sidebar + install guide modal
│   └── lib/
│       ├── api.js            # Typed HTTP API client (all backend calls)
│       └── utils.js          # Minimal utility helpers
├── extension/                # Chrome Extension MV3
│   ├── manifest.json         # Extension declaration + permissions
│   ├── content.js            # All panel UI + logic (~730 lines, shadow DOM)
│   ├── background.js         # Service worker (badge, notifications, downloads)
│   └── panel.css             # Minimal injected CSS (most styles are inline in content.js)
├── extension_old/            # DEAD CODE — old extension version, safe to delete
├── BRAIN.md                  # This file
└── .env                      # Root-level env (mirrors backend/.env for Prisma CLI)
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S LOCAL MACHINE                         │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────────────────────┐   │
│  │  Chrome Browser  │   │     Next.js Dashboard            │   │
│  │                  │   │     localhost:3000                │   │
│  │  ┌────────────┐  │   │                                  │   │
│  │  │ Extension  │  │   │  page.js (home / landing)        │   │
│  │  │ content.js │  │   │  jobs/page.js                    │   │
│  │  │ shadow DOM │  │   │  tracker/page.js                 │   │
│  │  │ panel UI   │  │   │  profile/page.js                 │   │
│  │  └────┬───────┘  │   │  settings/page.js                │   │
│  │       │          │   │  lib/api.js (HTTP client)        │   │
│  │  background.js   │   └──────────────┬───────────────────┘   │
│  │  (service worker)│                  │                        │
│  └──────────────────┘                  │                        │
│          │                             │                        │
│          │  HTTP to 127.0.0.1:3001     │  HTTP to 127.0.0.1:3001│
│          ▼                             ▼                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Express Backend  (port 3001)                  │  │
│  │                                                           │  │
│  │  /api/resume      /api/resumes   /api/jobs                │  │
│  │  /api/score       /api/tailor    /api/tracker             │  │
│  │  /api/settings    /health                                 │  │
│  │                                                           │  │
│  │  Services:                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐ │  │
│  │  │ gemini.js│ │aggregator│ │docGenerator│ │  db.js   │ │  │
│  │  │ (AI API) │ │ (4 APIs) │ │(docx+pdf)  │ │ (Prisma) │ │  │
│  │  └────┬─────┘ └────┬─────┘ └─────┬──────┘ └────┬─────┘ │  │
│  └───────┼────────────┼─────────────┼──────────────┼───────┘  │
│          │            │             │              │            │
│          ▼            ▼             ▼              ▼            │
│   Gemini API    4 External    backend/output/   prisma/        │
│   (Google)      Job APIs      (DOCX/PDF files)  dev.db         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

**Provider:** SQLite via Prisma 5.x  
**File:** `prisma/dev.db`  
**Schema:** `prisma/schema.prisma`  
**Prisma client output:** `backend/node_modules/.prisma/client`

### 4.1 Model: `Profile` (singleton — id always = 1)

The "active resume" consumed by every AI scoring and tailoring call. Always kept in sync with the default Resume record.

| Field | Type | Notes |
|---|---|---|
| id | Int (PK) | Always 1 — only one row ever exists |
| name, email, phone, location | String? | Contact info |
| summary | String? | Professional summary |
| skills | String? | **JSON string** → `Array<{category: string, items: string[]}>` |
| workHistory | String? | **JSON string** → `Array<{company, title, dates, bullets[]}>` |
| education | String? | **JSON string** → `Array<{institution, degree, field, dates}>` |
| certifications | String? | **JSON string** → `string[]` |
| projects | String? | **JSON string** → `Array<{name, role, tech, description, highlights[]}>` |
| additionalInfo | String? | **JSON string** → `{languages?, hobbies?}` |
| rawResumeText | String? | Raw extracted text from the original PDF/DOCX |
| updatedAt | DateTime | Auto-managed by Prisma |

> **CRITICAL:** SQLite has no native JSON column type. All array/object fields are JSON strings. **Always** `JSON.parse()` before reading and `JSON.stringify()` before writing. Forgetting this causes silent data corruption.

### 4.2 Model: `Resume` (multi-version — UUID PK)

Users can manage multiple named resume versions. Exactly one has `isDefault: true`. When a resume is set as default, it is synced to the singleton Profile.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID PK) | |
| name | String | Display name, e.g. "Senior Dev Resume" |
| isDefault | Boolean | Only one should be true at a time |
| personName | String? | **Naming inconsistency:** maps to `Profile.name` during sync |
| skills, workHistory, education, etc. | String? | Same JSON-string pattern as Profile |
| rawResumeText | String? | |
| createdAt, updatedAt | DateTime | |

> **Naming inconsistency:** `Resume.personName` ≠ `Profile.name`. The `syncToProfile()` function in `resumes.js` handles the field mapping.

### 4.3 Model: `Job`

Every discovered (aggregated or scraped) or manually added job listing.

| Field | Type | Notes |
|---|---|---|
| id | String (PK) | NOT a UUID. Encodes source: `greenhouse-{co}-{id}`, `adzuna-{id}`, `jsearch-{id}`, `manual-{co}-{title}-{timestamp}`, `lever-{co}-{id}` |
| title, company | String | Company defaults to "Unknown" if scraper can't detect it |
| location | String? | |
| url | String? | Link to original posting |
| description | String? | Full JD text; extension limits to 12,000 chars |
| source | String | `Greenhouse` \| `Lever` \| `Adzuna` \| `JSearch` \| `Manual` \| `Extension` |
| fitScore | Int? | 0–100 Gemini-generated match score |
| matchedSkills | String? | **JSON string** → `string[]` |
| missingSkills | String? | **JSON string** → `string[]` |
| rationale | String? | One-paragraph Gemini explanation |
| status | String | `Saved` → `Tailored` → `Applied` → `Interview` → `Offer` \| `Rejected` |
| appliedDate | DateTime? | Set when status transitions to `Applied` |
| tailoredDoc | TailoredDoc? | One-to-one relation |

### 4.4 Model: `TailoredDoc` (one-to-one with Job)

Stores AI-generated resume/cover letter content and absolute file paths to generated files.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID PK) | |
| jobId | String (unique FK) | `onDelete: Cascade` — deleted with its Job |
| tailoredResume | String | JSON-stringified `{summary, workHistory[], skills[]}` |
| tailoredCoverLetter | String | Plain text cover letter |
| resumePdfPath | String? | Absolute local path, e.g. `G:\autojobapply\backend\output\{jobId}-resume.pdf` |
| resumeDocxPath | String? | Absolute local path |

---

## 5. Backend Deep-Dive

### 5.1 Entry Point: `src/index.js`

**Startup sequence:**
1. `dotenv.config()` — load `backend/.env`
2. `cors({ origin: '*' })` — allow all origins (MVP shortcut)
3. `express.json({ limit: '10mb' })` — parse request bodies
4. Request logger middleware — logs `[timestamp] METHOD /path`
5. `loadSettings()` — reads `backend/settings.json` (if exists) or `.env`
6. Override `process.env` with settings values at runtime
7. Register all 7 routers
8. `syncOnStartup()` — syncs default Resume → Profile(1)
9. `app.listen(PORT)` — starts on port 3001

**`syncOnStartup()` rationale:** If the backend restarts after a resume upload, the Profile table must stay current. This function ensures Profile(1) always mirrors the default Resume on every server start.

### 5.2 All API Endpoints

| Method | Route | File | Description |
|---|---|---|---|
| POST | `/api/resume/upload` | resume.js | Upload PDF/DOCX/TXT → extract text → Gemini parse → upsert Profile(1) |
| GET | `/api/resume/profile` | resume.js | Return Profile(1) with all JSON fields deserialized |
| PUT | `/api/resume/profile` | resume.js | Manual profile update → upsert Profile(1) |
| GET | `/api/resumes` | resumes.js | List all resume versions ordered by default first |
| POST | `/api/resumes` | resumes.js | Create blank resume (first one auto-set as default) |
| GET | `/api/resumes/:id` | resumes.js | Get one resume version |
| PUT | `/api/resumes/:id` | resumes.js | Update resume fields; if default, syncs to Profile |
| DELETE | `/api/resumes/:id` | resumes.js | Delete; if was default, promotes next most recent |
| POST | `/api/resumes/:id/duplicate` | resumes.js | Clone resume without default flag |
| PUT | `/api/resumes/:id/set-default` | resumes.js | Clear all defaults → set this → sync to Profile |
| POST | `/api/resumes/:id/upload` | resumes.js | Parse file into a specific resume version |
| GET | `/api/jobs` | jobs.js | List jobs; optional `?status=` and `?minScore=` filters |
| POST | `/api/jobs/manual` | jobs.js | Create/find job from extension; `title` required, `company` defaults to "Unknown" |
| PUT | `/api/jobs/:id` | jobs.js | Update job fields (status, fitScore, appliedDate, etc.) |
| POST | `/api/jobs/trigger-aggregation` | jobs.js | Multi-source scraping + auto-score new jobs |
| POST | `/api/score/:jobId` | score.js | Score job vs Profile(1) via Gemini; updates job record |
| POST | `/api/tailor/:jobId` | tailor.js | Generate tailored resume + cover letter + 4 files; upsert TailoredDoc |
| GET | `/api/tailor/:jobId` | tailor.js | Retrieve existing tailored doc for a job |
| GET | `/api/tailor/:jobId/download/:docType/:format` | tailor.js | Stream file to client (docType: `resume`\|`coverletter`, format: `pdf`\|`docx`) |
| GET | `/api/tracker/board` | tracker.js | Jobs grouped by status for Kanban UI |
| GET | `/api/tracker/stats` | tracker.js | Count by status + avg fit score of applied jobs |
| GET | `/api/settings` | settings.js | Return current settings (from file or env fallback) |
| PUT | `/api/settings` | settings.js | Write settings.json + update process.env |
| GET | `/health` | index.js | `{ status: 'OK', message: '...' }` |

### 5.3 Service: `gemini.js`

**Model:** `gemini-2.5-flash` (both `DEFAULT_MODEL` and `PRO_MODEL` point to the same model)  
**Transport:** Native Node.js `fetch()` — no SDK dependency  
**Auth:** API key in query string `?key={GEMINI_API_KEY}`  
**Structured output:** Uses `responseSchema` + `responseMimeType: 'application/json'` for guaranteed JSON output

| Function | Called By | Input → Output |
|---|---|---|
| `parseResume(rawText)` | resume.js, resumes.js | Text → `{name, email, phone, location, summary, skills[], workHistory[], education[], certifications[], projects[]}` |
| `scoreJob(profile, jdText)` | score.js, jobs.js (auto) | Profile + JD → `{fitScore, matchedSkills[], missingSkills[], rationale}` |
| `tailorResume(profile, jdText)` | tailor.js | Profile + JD → `{summary, workHistory[], skills[]}` |
| `generateCoverLetter(profile, title, company, jdText)` | tailor.js | Profile + job info → plain text string |

> **Known Bug:** `GEMINI_API_KEY` is read at module load time (line 4). Updating via `PUT /api/settings` updates `process.env.GEMINI_API_KEY` but the module-level constant never changes. **Backend restart required** for key changes to take effect. Fix: move key read inside `callGemini()`.

### 5.4 Service: `aggregator.js`

All 4 sources run in parallel via `Promise.all()`. Individual source failures are caught and warned — they don't abort the entire aggregation.

| Source | URL Pattern | Free | Notes |
|---|---|---|---|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true` | Yes (public) | Hardcoded: stripe, cloudflare, okta, hubspot, snapchat, pinterest |
| Lever | `api.lever.co/v0/postings/{company}?mode=json` | Yes (public) | Hardcoded: lever, vercel, spotify, figma, deliveroo, deriv |
| Adzuna | `api.adzuna.com/v1/api/jobs/us/search/1` | Free tier | Requires `ADZUNA_APP_ID` + `ADZUNA_API_KEY`; US only; 15 results |
| JSearch | `jsearch.p.rapidapi.com/search` | Free tier | Requires `RAPIDAPI_KEY` via RapidAPI |

**Deduplication key:** `title.toLowerCase() + '|' + company.toLowerCase() + '|' + location.toLowerCase()`

### 5.5 Service: `docGenerator.js`

Generates 4 files per tailoring operation saved to `backend/output/`:

```
{jobId}-resume.pdf          (pdfkit — stream-based)
{jobId}-resume.docx         (docx library — buffer-based)
{jobId}-cover-letter.pdf    (pdfkit)
{jobId}-cover-letter.docx   (docx library)
```

Font: Arial (DOCX), Helvetica (PDF). Resume sections: Name, Contact, Summary, Skills (flat list), Experience, Education. Cover letter sections: Sender info, Date, Recipient, Subject, Body paragraphs.

> **Risk:** Files accumulate indefinitely. No cleanup. Disk space is an operational concern.

### 5.6 Service: `db.js`

```js
const prisma = new PrismaClient({ log: ['info', 'warn', 'error'] });
module.exports = prisma;
```

Module-level singleton. SQLite defaults to 5 connection pool. No explicit WAL mode.

### 5.7 Settings System (`api/settings.js`)

Settings are stored in `backend/settings.json`. If the file doesn't exist, `loadSettings()` falls back to environment variables. On PUT, it writes the file AND updates `process.env` immediately. Used by `index.js` at startup to apply the latest settings before routes are registered.

**Settings schema:**
```json
{
  "geminiApiKey": "",
  "adzunaAppId": "",
  "adzunaApiKey": "",
  "rapidApiKey": "",
  "defaultJobTitle": "Software Engineer",
  "defaultLocation": "Remote",
  "minFitScore": 70
}
```

---

## 6. Chrome Extension Deep-Dive

### 6.1 Manifest (`manifest.json`)

- **MV3 Service Worker:** `background.js`
- **Content Script:** `content.js` + `panel.css` injected into `<all_urls>` at `document_end`
- **Permissions:** `activeTab`, `scripting`, `storage`, `downloads`, `notifications`
- **Host permissions:** `http://127.0.0.1:3001/*` (backend access), `<all_urls>` (content injection)

### 6.2 `content.js` — Panel Architecture

A 730-line vanilla JS file that manages a **shadow DOM panel** docked to the right side of every page. The shadow DOM isolates all extension CSS from the host page.

**Key constants:**
```js
const API_BASE = 'http://127.0.0.1:3001/api';
```

**Key state:**
```js
let panelState = {
  status,       // idle | scanning | scoring | scored | error | manual | tailoring | tailored
  job,          // { id, title, company, location }
  score,        // { fitScore, matchedSkills[], missingSkills[], rationale }
  tailored,     // { tailoredResume, tailoredCoverLetter }
  activeTab,    // 'resume' | 'cover'
  applied,      // boolean
  favorite,     // boolean
  errorDetail,  // string
  creditError,  // boolean
  revealed      // { summary, skills, experience } — for progressive reveal animation
};
```

### 6.3 Panel State Machine

```
idle ─────────── No panel rendered. Initial state on every page.
   │
   │ [job detected by scrapeJD()]
   ▼
scoring ─────── Job card renders IMMEDIATELY with scraped data.
   │             "Tailor Resume" button shows "Scoring..." and is disabled.
   │
   ├──[save or score API call fails]──► error
   │                                     │ [Retry clicked]
   │                                     └──► scanning → scoring
   │
   │ [scoreJob() resolves]
   ▼
scored ─────── Job card + fit score badge + matched skills visible.
   │
   │ [user clicks "Tailor Resume"]
   ▼
tailoring ──── Spinner with progressive label updates (Preparing... Rewriting... etc.)
   │
   │ [tailorJob() resolves]
   ▼
tailored ───── Full panel: resume/cover preview + Download + Autofill buttons.

scanning ───── Spinner shown during force-retry or reload.

manual ──────── No JD found; shows title/company/description input form.
```

> **History note:** Before July 2026, the flow used `scored-pending` (spinner mid-flow) and set status back to `idle` post-score (which accidentally re-showed the spinner). Both bugs were fixed — panel now shows immediately at `scoring` and terminates at `scored`.

### 6.4 Job Detection Algorithm

```
every page navigation (250ms debounced MutationObserver + 1s href poll)
  ↓
isExcludedHost()? → abort (localhost, google, youtube, github, etc.)
  ↓
scrapeJD():
  - Look up SELECTORS map by hostname
  - textOf(selector) for title, company, location, description
  - If no platform match: try GENERIC_FALLBACK (h1 + main/article)
    - Generic only valid if JD_KEYWORDS regex matches description
  - Returns { found, title, company, location, description, url }
  ↓
if !found && force: status = 'manual'
  ↓
SHA-1 hash of title+company+desc.slice(0,500)
  - if hash unchanged since last run: skip (SPA same-page navigation guard)
  ↓
startJobFlow(jd) [see Data Flow section]
```

**JD_KEYWORDS regex:** `/responsibilities|requirements|qualifications|job description|about the role|what you.?ll do|apply now|years of experience|job type|employment type/i`

### 6.5 Known Platform Selectors

| Platform | Title | Company | Description |
|---|---|---|---|
| `linkedin.com` | `.job-details-jobs-unified-top-card__job-title, h1.t-24` | `.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name` | `.jobs-description__content, .jobs-box__html-content` |
| `indeed.com` | `h1.jobsearch-JobInfoHeader-title` | `[data-testid="inlineHeader-companyName"]` | `#jobDescriptionText` |
| `naukri.com` | `.jd-header-title` | `.jd-header-comp-name` | `.job-desc, .dang-inner-html` |
| `greenhouse.io` | `.app-title, #header .app-title` | `.company-name` | `#content` |
| `lever.co` | `.posting-header h2` | `.main-header-logo img` | `.section.page-centered` |

**To add a new platform:** Add an entry to the `SELECTORS` object in `content.js` keyed by hostname (without `www.`).

### 6.6 `background.js` — Service Worker

Listens for `chrome.runtime.onMessage` from `content.js`:

| `msg.action` | What it does |
|---|---|
| `setBadge` | `chrome.action.setBadgeText({ tabId, text })` + sets badge color to `#8b5cf6` (purple) |
| `notify` | `chrome.notifications.create({ type:'basic', iconUrl:'icon.png', title, message })` |
| `downloadFile` | `chrome.downloads.download({ url, filename, saveAs:false })` — content scripts can't use Downloads API |

### 6.7 Autofill System

`autofillForm(tailored)` is called when the user clicks "Autofill Form":

1. `GET /api/resume/profile` → fetches name, email, phone, location
2. For each field type, tries selectors in priority order until one is found in the DOM
3. Sets `element.value`, dispatches `input` + `change` events (triggers React/Vue/Angular reactivity)
4. Highlights filled fields with `outline: 2px solid #06b6d4` (cyan)
5. Highlights file inputs with `outline: 2px dashed #a855f7` (purple dashed) + sets hint title
6. **Never** searches for or clicks a Submit/Apply button — by design

---

## 7. Dashboard Deep-Dive

### 7.1 Stack

- **Next.js 16.2.10** with App Router + Turbopack (dev) + React 19
- **Tailwind CSS v4** — utility-first throughout (contrast: extension uses vanilla CSS inside shadow DOM)
- **Fonts:** Geist Sans + Geist Mono (Google Fonts via `next/font`)

### 7.2 Authentication (Fake — MVP Only)

There is **no real auth server**. Authentication is simulated via localStorage:

| Key | Value | Purpose |
|---|---|---|
| `jobforge_logged_in` | `'true'` | Login flag |
| `jobforge_user_name` | e.g. `'Amit Makwana'` | Display name in Navbar |
| `jobforge_user_email` | e.g. `'amitbmakwana1@gmail.com'` | Email in Navbar |
| `jobforge_plan` | `'Free Plan'` \| `'Pro Plan'` | Plan badge in sidebar |

Any user can bypass auth by opening DevTools → Application → Local Storage and setting `jobforge_logged_in = 'true'`.

### 7.3 Pages & Responsibilities

| Route | Key Behavior |
|---|---|
| `/` | Reads `localStorage.jobforge_logged_in`. If false: marketing landing with hero, features, ROI calculator, pricing, FAQ. If true: stats overview via `GET /api/tracker/stats`. |
| `/jobs` | Lists all jobs. Supports filter by min score + status. Triggers aggregation via `POST /api/jobs/trigger-aggregation`. Selects job → loads tailored docs. Tailor button → `POST /api/tailor/:id`. Download via direct URL links. |
| `/tracker` | Loads board (`GET /api/tracker/board`) + all jobs (`GET /api/jobs`). Toggle list/kanban view. Status dropdown per job → `PUT /api/jobs/:id`. Optimistic local state update. |
| `/profile` | Upload resume → `POST /api/resume/upload`. Edit profile fields → `PUT /api/resume/profile`. Multi-version management via `/api/resumes/*`. |
| `/settings` | Load via `GET /api/settings`. Update via `PUT /api/settings`. |
| `/login` | Sets localStorage flags → redirects to `/`. No server call. |
| `/signup` | Same as login. |

### 7.4 `ClientLayoutWrapper.js` — Auth Guard + Sidebar

Wraps every page via `layout.js`. Runs `useEffect` on every route change (`pathname` dependency):
- Checks `localStorage.jobforge_logged_in`
- Unauthenticated + non-root/non-auth route → `router.push('/login')`
- Authenticated + auth route → `router.push('/')`
- Authenticated → renders sidebar, loads stats, applies plan badge

**Custom events consumed:**
- `open-install-guide` → opens Chrome extension install guide modal (3-step)
- `toggle-sidebar` → toggles sidebar open/closed

### 7.5 API Client (`lib/api.js`)

All backend calls go through this single module. Base URL is **hardcoded** to `http://127.0.0.1:3001/api`.

```js
const API_BASE = 'http://127.0.0.1:3001/api'; // hardcoded — change here to change everywhere
```

Error handling: throws `Error` with backend's `error` message or HTTP status on non-OK responses.

---

## 8. Data Flow: End-to-End Workflows

### Workflow A: Resume Upload → AI Parse → Profile

```
1. User selects PDF/DOCX/TXT file in dashboard /profile
2. FormData with file → POST /api/resume/upload (multipart)
3. multer saves to backend/uploads/{hash} (temp)
4. Route extracts rawText:
   - .pdf  → pdf-parse(buffer).text
   - .docx → mammoth.extractRawText().value
   - .txt  → fs.readFileSync(path, 'utf-8')
5. fs.unlinkSync(filePath) — delete temp file immediately
6. Gemini parseResume(rawText) with structured schema
7. prisma.profile.upsert({ where:{id:1}, ...parsedData, rawResumeText })
8. Response: full profile object with deserialized arrays
```

### Workflow B: Extension Job Detection → Score (Primary Extension Flow)

```
1. Browser opens job listing page
2. 250ms debounce fires → runDetectionCycle()
3. isExcludedHost()? → abort
4. scrapeJD() → { found:true, title, company, location, description, url }
5. SHA-1 hash check → same as last? skip
6. startJobFlow(jd):
   a. panelState.status = 'scoring'
      panelState.job = { title, company, location } (no ID yet)
      render() ← PANEL APPEARS IMMEDIATELY (~250ms from page load)
   b. POST /api/jobs/manual { title, company:'Unknown' if empty, location, description, url, source:'Extension' }
      → jobs.js: findUnique(jobKey) OR create → { message, job:{ id, ... } }
      → extension unwraps: data.job → jobId assigned to panelState.job.id
   c. POST /api/score/:jobId
      → score.js: profile = prisma.profile.findUnique({id:1})
      → gemini.scoreJob(parsedProfile, job.description) → { fitScore, matchedSkills, missingSkills, rationale }
      → prisma.job.update(score fields)
      → { job: { fitScore, matchedSkills[], ... } }
   d. panelState.score = result
      panelState.status = 'scored'
      render() ← SCORE BADGE APPEARS
7. chrome.runtime.sendMessage({ action:'setBadge', text:'●' })
```

### Workflow C: Resume Tailoring (Extension or Dashboard)

```
1. POST /api/tailor/:jobId
2. tailor.js:
   a. prisma.job.findUnique({ id:jobId })
   b. prisma.profile.findUnique({ id:1 })
   c. [sequential — OPTIMIZATION OPPORTUNITY] await tailorResume(profile, jd)
   d. [sequential] await generateCoverLetter(profile, job.title, job.company, jd)
   e. Generate 4 files in backend/output/:
      - generateResumeDocx → {jobId}-resume.docx
      - generateResumePdf  → {jobId}-resume.pdf
      - generateCoverLetterDocx → {jobId}-cover-letter.docx
      - generateCoverLetterPdf  → {jobId}-cover-letter.pdf
   f. prisma.tailoredDoc.upsert({ jobId, tailoredResume:JSON.stringify(data), tailoredCoverLetter, paths })
   g. if job.status === 'Saved': prisma.job.update({ status:'Tailored' })
3. Response: { tailoredDoc: { tailoredResume (parsed), tailoredCoverLetter } }
```

### Workflow D: Document Download

```
Extension:
  chrome.runtime.sendMessage({ action:'downloadFile', url: API_BASE+'/tailor/{id}/download/resume/docx', filename })
  → background.js: chrome.downloads.download({ url, filename, saveAs:false })

Dashboard:
  <a href={`${API_BASE}/tailor/${jobId}/download/resume/docx`} download>

Both lead to:
  GET /api/tailor/:jobId/download/:docType/:format
  → prisma.tailoredDoc.findUnique({ jobId })
  → select filePath from DB
  → fs.existsSync(filePath) check
  → res.download(filePath, fileName)
```

### Workflow E: Job Aggregation (Dashboard)

```
1. User enters search title + location → "Find Jobs" button
2. POST /api/jobs/trigger-aggregation { title, location }
3. jobs.js: aggregateJobs(title, location) — 4 sources in parallel
4. For each new job (not in DB):
   a. prisma.job.create(...)
   b. If profile exists + job has description:
      → gemini.scoreJob(parsedProfile, job.description) — AUTO-SCORE
      → job saved with fitScore, matchedSkills, missingSkills, rationale
5. Response: { addedCount, scoredCount }
```

---

## 9. Environment Variables

| Variable | Files | Purpose | Required |
|---|---|---|---|
| `PORT` | `backend/.env` | Express server port | No (default: 3001) |
| `DATABASE_URL` | `backend/.env`, root `.env` | SQLite: `file:./dev.db` | Yes |
| `GEMINI_API_KEY` | `backend/.env` | Google Generative AI key | Yes |
| `ADZUNA_APP_ID` | `backend/.env` | Adzuna app ID | No (aggregation skipped if absent) |
| `ADZUNA_API_KEY` | `backend/.env` | Adzuna API key | No |
| `RAPIDAPI_KEY` | `backend/.env` | JSearch RapidAPI key | No |

**Why two `.env` files?** The root `.env` is for running `npx prisma` CLI from the project root. The `backend/.env` is used when nodemon starts the server from the `backend/` directory. Both must be kept in sync.

**Settings file override:** `backend/settings.json` takes precedence over `.env` for all API keys at runtime. Written by `PUT /api/settings`.

---

## 10. Startup Guide

### Prerequisites
- Node.js 18+
- Chrome browser
- `npm install` in both `backend/` and `dashboard/`

### Start Backend
```bash
cd backend
npm run dev         # nodemon src/index.js → http://localhost:3001
```

### Start Dashboard
```bash
cd dashboard
npm run dev         # next dev → http://localhost:3000
```

### Load Extension in Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. **Load unpacked** → select the `extension/` folder
4. After any code change → click ↺ refresh on the JobForge AI card

### Prisma CLI Commands (run from `backend/`)
```bash
cd backend
npx prisma migrate dev       # apply schema changes, create dev.db if needed
npx prisma studio            # visual browser at http://localhost:5555
npx prisma generate          # regenerate client after schema change
```

---

## 11. Security Analysis

| Risk | Severity | Detail |
|---|---|---|
| `CORS: origin: '*'` | **HIGH** | Any website can call the local backend. No practical risk when truly local, but catastrophic if ever deployed. |
| API keys in `.env` (potentially committed) | **CRITICAL** | `GEMINI_API_KEY`, Adzuna, RapidAPI keys appear to be in committed `.env` files. Rotate all keys immediately if the repo has been public. |
| Fake localStorage auth | **HIGH** | Any user can set `localStorage.jobforge_logged_in = 'true'` in browser devtools. No server validates sessions. |
| No rate limiting | **MEDIUM** | No throttling on any endpoint. A script could exhaust Gemini quota in seconds. |
| Extension `<all_urls>` host permission | **MEDIUM** | Content script runs on every page. Mitigated by `EXCLUDED_HOSTS` list. |
| Absolute file paths in DB | **LOW** | `resumePdfPath` / `resumeDocxPath` expose local file structure. Risk only if API is ever exposed publicly. |
| No HTTPS | **MEDIUM** | All traffic is plain HTTP. Acceptable on localhost only. |
| No input validation beyond basic checks | **MEDIUM** | Backend has minimal validation — e.g., job description could inject content into AI prompts. No active threat in local use. |

---

## 12. Technical Debt & Known Issues

| # | Issue | Impact | Location | Recommended Fix |
|---|---|---|---|---|
| 1 | `GEMINI_API_KEY` read at module load | Settings key update requires restart | `gemini.js:4` | Move `const GEMINI_API_KEY = process.env.GEMINI_API_KEY` inside `callGemini()` |
| 2 | Sequential Gemini calls in tailor | 6–20s tailor latency | `tailor.js:55-58` | `const [tailored, cover] = await Promise.all([tailorResume(...), generateCoverLetter(...)])` |
| 3 | No file cleanup for `backend/output/` | Disk fills indefinitely | `tailor.js`, `docGenerator.js` | Delete old files on upsert or add a nightly cleanup script |
| 4 | Hardcoded company lists in aggregator | Limited job discovery | `aggregator.js:5-6` | Make configurable via settings UI |
| 5 | No pagination on `GET /api/jobs` | Memory + query perf at scale | `jobs.js` | Add `?skip=&take=` query params |
| 6 | Fake auth (localStorage) | No real security | `dashboard/` | Implement real JWT/session auth (or Clerk/Auth.js) |
| 7 | `lib/api.js` hardcodes `127.0.0.1:3001` | Can't configure backend URL | `dashboard/lib/api.js:1` | `const API_BASE = process.env.NEXT_PUBLIC_API_BASE \|\| 'http://127.0.0.1:3001/api'` |
| 8 | Duplicate file upload + parse logic | Code drift risk | `resume.js` + `resumes.js` | Extract `extractAndParseResume(file)` utility |
| 9 | `panel.css` is nearly empty | Misleading file | Extension | Remove or document (all styles are in `PANEL_STYLES` constant in `content.js`) |
| 10 | `extension_old/` in repo | Confusion | Root | Delete the directory |
| 11 | Profile `id = 1` hardcoded everywhere | Single-user only | All API routes | Future: UUID-based profiles with user sessions |
| 12 | No error boundaries in dashboard | Unhandled errors crash entire page | Dashboard | Wrap route-level components in React `<ErrorBoundary>` |
| 13 | No automated tests | Zero coverage | Entire codebase | Jest + supertest (backend), Playwright (dashboard) |
| 14 | No DB indexes on Job | Slow queries at scale | `schema.prisma` | Add `@@index([status])`, `@@index([fitScore])`, `@@index([createdAt])` |

---

## 13. Dependency Map

### Backend Module Graph
```
src/index.js
 ├── ./services/db.js         ← PrismaClient singleton (imported by ALL api/ files)
 ├── ./api/resume.js          ← db.js, gemini.js, multer, pdf-parse, mammoth, fs, path
 ├── ./api/resumes.js         ← db.js, gemini.js, multer, pdf-parse, mammoth, fs, path
 ├── ./api/jobs.js            ← db.js, aggregator.js, gemini.js
 ├── ./api/score.js           ← db.js, gemini.js
 ├── ./api/tailor.js          ← db.js, gemini.js, docGenerator.js, fs, path
 ├── ./api/tracker.js         ← db.js
 └── ./api/settings.js        ← fs, path (NO db.js, NO gemini.js)
```

### Dashboard Module Graph
```
app/layout.js
 ├── components/Navbar.js     ← next/navigation, next/link
 └── components/ClientLayoutWrapper.js ← next/navigation, lib/api.js

All app/*/page.js files      ← lib/api.js
lib/api.js                   ← fetch() → backend HTTP
```

### Extension Message Flow
```
content.js
 ├── fetch() → http://127.0.0.1:3001/api/*    (direct backend calls)
 └── chrome.runtime.sendMessage() → background.js

background.js
 ├── chrome.action.setBadgeText()
 ├── chrome.notifications.create()
 └── chrome.downloads.download()
```

### npm Package Dependencies

**Backend:**
| Package | Purpose |
|---|---|
| express | HTTP server framework |
| cors | CORS middleware |
| dotenv | `.env` loader |
| @prisma/client | ORM — SQLite data access |
| multer | Multipart file upload parsing |
| pdf-parse | PDF text extraction |
| mammoth | DOCX text extraction |
| docx | DOCX file generation |
| pdfkit | PDF file generation |
| nodemon (dev) | Auto-restart on file change |
| prisma (dev) | Migration + Prisma Studio CLI |

**Dashboard:**
| Package | Purpose |
|---|---|
| next 16.2.10 | React framework (App Router + Turbopack) |
| react + react-dom 19.2.4 | UI library |
| tailwindcss v4 | Utility CSS |
| @tailwindcss/postcss | PostCSS integration |

**Extension:** No npm dependencies — pure vanilla JS.

---

## 14. Performance Considerations

| Bottleneck | Where | Typical Impact | Mitigation |
|---|---|---|---|
| Gemini API round-trip latency | Every score/tailor/parse | 2–10 seconds per call | Extension: immediate panel render before score returns |
| Sequential tailor + cover letter | `tailor.js` | 2× latency (~6–20s total) | Parallelize with `Promise.all` |
| Full JD text in prompt | `gemini.js` prompts | Token cost + latency increase | Extension already limits to 12,000 chars |
| SQLite file locking | `db.js` | Concurrent writes can fail | Enable WAL mode or migrate to PostgreSQL |
| No DB indexes on Job | `schema.prisma` | Full table scans at scale | Add indexes on `status`, `fitScore` |
| `/api/tracker/stats` called on every route change | `ClientLayoutWrapper.js` | Redundant DB queries | Client-side TTL cache or debounce |
| Extension debounce | `content.js` | 250ms before first scan | Already optimized (was 900ms) |
| No score caching | `score.js` | Same job rescored repeatedly | Cache `{jobId → score}` in memory with TTL |

---

## 15. Failure Modes

| Scenario | Symptoms | Resolution |
|---|---|---|
| Backend not running | Extension: "Can't reach the JobForge backend" error panel. Dashboard: API errors on all pages. | `cd backend && npm run dev` |
| `GEMINI_API_KEY` missing or invalid | Score/tailor/parse return 500 "GEMINI_API_KEY is not configured" or Gemini API 400/403 | Set key in `backend/.env` → restart backend. Or update via `/api/settings` → restart. |
| Settings API key update not working | Gemini still uses old key | **Known bug:** restart backend. Gemini module reads key at module load time. |
| Profile (id=1) missing | Score returns 400 "Please upload a resume profile first". Tailor returns 400 "No profile found." | Upload resume via dashboard `/profile` page |
| `company` field empty from scraper | **Was:** 400 "Title and Company are required." → error panel shown. **Fixed July 2026.** | N/A — defaults to "Unknown" |
| `saved.id` was undefined | **Was:** `scoreJob(undefined)` → 404 → error panel. **Fixed July 2026.** | N/A — response now correctly unwraps `data.job` |
| Panel shows spinner after scoring | **Was:** status reset to `'idle'` post-score re-showing spinner. **Fixed July 2026.** | N/A — now correctly uses `'scored'` status |
| Extension not reloaded | Old JS runs; new fixes not applied | Reload extension in `chrome://extensions` + refresh tab |
| Gemini quota exceeded | 429 errors on score/tailor | Wait for quota reset; upgrade to paid Gemini tier |
| `dev.db` deleted | All jobs, resumes, profile lost | `cd backend && npx prisma migrate dev` creates fresh DB |
| `backend/output/` files missing | Download returns 404 "File not found on disk" | Re-run tailoring for affected jobs |
| Extension triggers on wrong page | Panel appears on non-job pages | Check if `EXCLUDED_HOSTS` or `JD_KEYWORDS` regex needs updating |
| Panel doesn't appear at all | Extension not loaded, or page is in `EXCLUDED_HOSTS`, or JD too short (<200 chars) | Check extension is loaded; check excluded hosts list; verify JD content length |

---

## 16. Conventions

1. **JSON in SQLite:** All complex fields stored as JSON strings. The canonical deserialization pattern (from `resumes.js`) is:
   ```js
   function parseFields(row) {
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
   ```

2. **Profile singleton:** Profile id is always `1`. Every route that needs resume data: `prisma.profile.findUnique({ where: { id: 1 } })`.

3. **Job ID encoding:** IDs are not random — they encode provenance:
   - `greenhouse-{company}-{greenhouseId}`
   - `lever-{company}-{leverId}`
   - `adzuna-{adzunaId}`
   - `jsearch-{jsearchJobId}`
   - `manual-{company}-{title}-{Date.now()}` (from extension or dashboard)

4. **Job status lifecycle:**
   `Saved` → (tailor endpoint) → `Tailored` → (user action) → `Applied` → `Interview` → `Offer` | `Rejected`

5. **Error response shape:** All backend errors return `res.status(4xx/5xx).json({ error: 'message string' })`. No structured error codes or types.

6. **File paths:** Absolute paths from `path.join(__dirname, ...)` stored in DB. Moving the repo to a different machine invalidates all stored download paths.

7. **Extension reload:** Required after **every** change to `content.js` or `background.js`. There is no hot reload for unpacked extensions.

8. **`escapeHtml()` in extension:** All user data rendered into the panel HTML must go through `escapeHtml()` to prevent XSS from malicious job descriptions.

---

## 17. Adding New Features

### Add a new job aggregation source
1. Write `fetchXxxJobs(query, location)` in `aggregator.js` following the existing pattern
2. Add it to `Promise.all()` in `aggregateJobs()`
3. Add new credential fields to `settings.json` defaults in `loadSettings()` and the PUT handler in `settings.js`
4. Add to `backend/.env` with comments

### Add a new job platform to extension
1. Add entry to `SELECTORS` in `content.js`:
   ```js
   'example.com': {
     title: '.job-title-selector',
     company: '.company-name-selector',
     description: '.job-description-selector',
     location: '.location-selector'
   }
   ```
2. Test with `scrapeJD()` on a real job page

### Add a new backend API endpoint
1. Create `backend/src/api/newRoute.js` with Express router
2. `const newRouter = require('./api/newRoute')` + `app.use('/api/xxx', newRouter)` in `index.js`
3. Add corresponding method(s) to `dashboard/lib/api.js`

### Migrate from SQLite to PostgreSQL
1. Edit `prisma/schema.prisma`: `provider = "postgresql"`
2. Update `DATABASE_URL` in both `.env` files to a Postgres connection string
3. `cd backend && npx prisma migrate dev` — creates tables in Postgres
4. No application code changes required (Prisma abstracts the driver)

### Add real authentication
1. Install Clerk, Auth.js, or similar
2. Add `userId` field to `Profile` and `Job` models
3. Add auth middleware to all routes
4. Replace localStorage checks in dashboard with session reads

---

## 18. Quick Diagnostics Checklist

### Extension shows "Can't reach the JobForge backend"
- [ ] Is the backend running? Check: `curl http://localhost:3001/health`
- [ ] Is port 3001 in use by something else? `netstat -an | findstr 3001`
- [ ] Was `content.js` edited without reloading the extension?
- [ ] Is the current page in `EXCLUDED_HOSTS`?

### Score/tailor returns 400 "Please upload a resume first"
- [ ] `curl http://localhost:3001/api/resume/profile` — does it return a profile?
- [ ] Upload resume via Dashboard → Profile page

### Settings API key change doesn't work for Gemini
- [ ] Restart the backend — Gemini module reads key at load time (known bug #1)

### Tailor produces generic/empty sections
- [ ] Does the job have a description? `GET /api/jobs/{id}`
- [ ] Is the Profile populated? `GET /api/resume/profile`

### Dashboard shows blank or redirects to login
- [ ] DevTools → Application → Local Storage → `localhost:3000`
- [ ] Set `jobforge_logged_in = 'true'` and refresh

### Extension panel doesn't appear on a job page
- [ ] Extension loaded in `chrome://extensions`?
- [ ] Is the hostname in `EXCLUDED_HOSTS`? Check `content.js` line ~52
- [ ] Does `scrapeJD()` find content? Title required + description > 200 chars
- [ ] New job site? Add selectors to `SELECTORS` map in `content.js`

### Downloaded file returns 404
- [ ] Does `backend/output/{jobId}-resume.docx` exist on disk?
- [ ] Re-run tailoring — file may have been deleted (no cleanup mechanism)

### Job aggregation returns 0 new jobs
- [ ] Are Adzuna + RapidAPI keys configured in settings?
- [ ] Check backend logs for `Failed to fetch` warnings per source
- [ ] Greenhouse + Lever are public APIs but may be rate-limited or offline
