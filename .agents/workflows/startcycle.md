# Workflow: Start the Job Application Cycle
name: startcycle
description: "Start the autonomous job application pipeline."
steps:
  - agent: Job Hunter
    task: "Find jobs for my profile."
  - agent: Resume Tailor
    task: "Tailor my resume for each job found."
  - agent: Auto-Applicant
    task: "Start the auto-apply process for all jobs."
