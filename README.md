# ApplyAI: AI-Powered Job Application Assistant

ApplyAI is a full-stack, autonomous job-application system built with Next.js, Node/Express, SQLite (via Prisma), and powered by the Gemini API. It scans job boards, parsed resumes, auto-scores matches, generates tailored resume and cover letter drafts, and uses a Chrome Extension to autofill job applications.

---

## 🚀 Key Features

1. **AI Resume Parser**: Extract structured skills, timeline, and education from standard PDF/DOCX resumes using Gemini JSON-Schema formatting.
2. **Job Aggregator**: Auto-pull postings matching your search profile from public Greenhouse/Lever boards, Adzuna, and JSearch (RapidAPI).
3. **Gemini Fit Scoring**: 0–100 matching score, matched keywords, missing keywords, and rationale breakdown.
4. **Tailoring Engine**: Re-writes summary, reorders work bullets (never fabricating facts), generates cover letters, and exports formatted PDF and DOCX downloadables.
5. **Kanban Tracker Board**: Manage pipelines easily from Scouted → Tailored → Applied → Interview → Offer.
6. **Chrome Extension (Manifest V3)**: Detects JD text on LinkedIn, Indeed, Naukri, Greenhouse, Lever, and injects customized autofills directly onto the form fields.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- A Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/apikey))
- (Optional) Adzuna API Key, RapidAPI Key (for JSearch)

### 1. Configure Environment Variables
A `.env` file has been created at the root (`/`) and inside `/backend/.env` with your Gemini API Key pre-filled:
```env
PORT=3001
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_api_key"
ADZUNA_APP_ID="optional_adzuna_app_id"
ADZUNA_API_KEY="optional_adzuna_api_key"
RAPIDAPI_KEY="optional_jsearch_rapidapi_key"
```

### 2. Launch the Express Backend
Open your terminal and run:
```bash
cd backend
npm run dev
```
The server will boot up at `http://localhost:3001`.

### 3. Launch the Dashboard
Open another terminal and run:
```bash
cd dashboard
npm run dev
```
The Next.js dashboard will boot up at `http://localhost:3000`.

### 4. Load the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` directory inside this workspace.

---

## 🎯 Verification Guide / Daily Flow

1. **Dashboard Home**: Go to `http://localhost:3000` and upload your PDF or DOCX resume on the **My Profile** tab. The AI parser will convert it to a structured timeline.
2. **Scout for Jobs**: Navigate to **Job Feed** or the Home page, input a target title and location (e.g. `Software Engineer`, `Remote`), and click **Scan Job Boards**. This aggregates live vacancies and scores them.
3. **Tailor Documents**: On any job detail card in the feed, click **Generate Tailored Resume & Cover Letter**. This generates customized PDF and DOCX files.
4. **Auto-Fill Applications**: Navigate to a live LinkedIn or Greenhouse job posting in your browser. Open the extension popup, click **Analyze & Score JD**, click **Tailor**, then click **Autofill Visible Form Fields**. Your details will inject, and you can upload the tailored resume file before clicking **Submit** manually.
