# JobForge AI Extension v2 — Auto-Detect Panel

## Install
1. Make sure your backend is running on `http://127.0.0.1:3001` (`cd backend && npm run dev`)
2. Go to `chrome://extensions`, enable Developer Mode
3. Click "Load unpacked" → select this `extension/` folder (replace your existing one, or load as a second unpacked extension while testing)
4. Visit any job posting (LinkedIn, Indeed, Naukri, Greenhouse, Lever, or any other site) — the panel should auto-appear on the right within ~1 second of the page settling

## Backend changes required for this to work end-to-end

1. **`favorite` field on Job model** — not in your current schema. Add to `prisma/schema.prisma`:
   ```prisma
   favorite Boolean @default(false)
   ```
   then `npx prisma migrate dev --name add_favorite`

2. **PUT /api/jobs/:id must accept `favorite`** — check `backend/src/api/jobs.js` passes it through to `prisma.job.update()`.

3. **402 status on quota exceeded** — `runTailoring()` in content.js expects a `402` HTTP status from `POST /api/tailor/:jobId` when Gemini credits/plan limits are exhausted, to show the "out of credits" state. Add that check in `backend/src/api/tailor.js` if you want the credit-limit UI to actually trigger (right now it may just throw a generic 500).

4. **Autofill field values** — `autofillForm()` currently reads `tailored.profileName / profileEmail / profilePhone` which aren't in your current `TailoredDoc` shape. Either add these to the tailor response (join from `Profile` table server-side) or adjust `autofillForm()` to pull them from a separate `/api/resume/profile` call.

## What this version adds vs. your existing extension
- Passive auto-detection (no click required) via debounced MutationObserver + SPA URL-change polling
- Shadow DOM panel — fully isolated from host page CSS
- Match score badge + matched skills tags
- Live section-by-section "tailoring" reveal (currently simulated with staged delays around your existing non-streaming `/api/tailor/:jobId` call — see comment in `runTailoring()` for how to swap in true streaming later)
- Manual entry fallback when scraping fails
- Favorite / Mark as Applied checkboxes synced to the backend
- Download button (resume + cover letter, DOCX)
- Autofill with a completion notification — never touches the host page's own Submit/Apply button, by design

## Known simplifications (call these out if you hand this to another agent)
- Autofill selectors are generic (`input[type=email]` etc.) — not per-platform yet. Extend `autofillForm()`'s `fieldMap` with platform-specific selectors the same way `SELECTORS` handles JD scraping, if LinkedIn/Indeed/Naukri's actual field names need more precision.
- The "live reveal" is a UX simulation, not real Gemini token streaming. Good enough for the effect you saw in the demo video; upgrade to true streaming only if you want token-level granularity.
- No de-dupe against jobs already saved from the dashboard's own aggregator — `saveJobManual` relies on your backend's existing dedupe logic (title|company|location).
