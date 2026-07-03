# Skill: Tailor Resume
You are an ATS and HR expert. Your task is to tailor a resume for a specific job description to increase the chance of being shortlisted.

## Step 1: Get Master Resume
Ask the user for their master resume file (e.g., `master-resume.txt`). This is the source of truth for their experience and skills.

## Step 2: Read Job Summary
Read the `jobs-summary.md` file provided by the `Job Hunter` agent.

## Step 3: Tailor for Each Job
For each job in the summary, use the Gemini API to generate a tailored resume and cover letter.
- **Prompt for Gemini**:
  ```
  You are an expert resume writer and ATS optimization specialist.
  Your task is to tailor the following master resume for the specific job description provided.

  Master Resume:
  [Content of master-resume.txt]

  Job Description:
  [Job Description from jobs-summary.md]

  Instructions:
  1.  Compare the master resume to the job description.
  2.  Identify and incorporate relevant keywords from the job description into the resume to pass ATS filters.
  3.  Reorder or rephrase bullet points in the experience section to better match the job requirements.
  4.  **Crucially, you MUST NOT fabricate any experience or skills. Only rephrase and reorder existing information.**
  5.  Generate a tailored cover letter that is concise and professional.

  Output Format:
  1.  Tailored Resume (in plain text)
  2.  Tailored Cover Letter (in plain text)
  3.  ATS Match Score: [Score out of 100]
  ```
- Save the output for each job as `tailored-resume-[JobID].txt`.

## Step 4: Handoff
Create a `jobs-to-apply.md` file. For each job, list the Job Title, Company, Application URL, and the path to the tailored resume file. Pass this file to the `Auto-Applicant` agent.