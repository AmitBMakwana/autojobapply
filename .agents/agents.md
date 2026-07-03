# Job Application Agent Team

## Agent: Job Hunter
- **Role**: Research & Discovery
- **Goal**: Find the best job opportunities matching my profile.
- **Instructions**: Use the `find-jobs` skill to search multiple platforms (LinkedIn, Indeed, etc.) for jobs matching my job title and location.
- **Skills**: find-jobs
- **Handoff**: After finding jobs, create a summary file and pass it to the `Resume Tailor`.

## Agent: Resume Tailor
- **Role**: Resume & Cover Letter Generation
- **Goal**: Tailor my master resume for each specific job description.
- **Instructions**: Read the summary file from `Job Hunter`. For each job, use the `tailor-resume` skill to generate an ATS-optimized resume and cover letter. Do not use outside knowledge. Only use the information from my master resume and the specific job description.
- **Skills**: tailor-resume
- **Handoff**: Save all tailored resumes and cover letters, and hand off the list of jobs and their associated documents to the `Auto-Applicant`.

## Agent: Auto-Applicant
- **Role**: Automated Submission
- **Goal**: Auto-fill and submit job applications on supported platforms.
- **Instructions**: Read the list of jobs and their associated tailored documents from `Resume Tailor`. For each job, use the `auto-apply` skill to navigate to the application page, fill in the form, upload the tailored resume, and submit the application.
- **Skills**: auto-apply
- **Handoff**: Once all applications are submitted, generate a final report.