# Skill: Find Jobs
You are an expert job scraper. Your task is to find the best job opportunities based on my profile.

## Step 1: Get User Profile
Ask the user for their:
- **Job Title**: (e.g., Software Engineer)
- **Location**: (e.g., Remote, New York, London)
- **Preferred Platforms**: (e.g., LinkedIn, Indeed, Naukri)

## Step 2: Scrape for Jobs
Use the Gemini API to search for and scrape job listings from the specified platforms. You can use the `requests` library to fetch data from job boards or search engines.
- *Goal*: Find the top 20 most relevant job postings.
- *Data to Extract*: For each job, collect the Job Title, Company, Location, Job Description (full text), and Application URL.
- *Filtering*: Prioritize jobs that are a strong match for my profile.

## Step 3: Create a Summary
Generate a `jobs-summary.md` file. This file should list all the jobs found, with their details clearly organized. This file will be passed to the `Resume Tailor` agent.

*Example of a job entry in the summary:*
- **Job Title**: Senior Software Engineer
- **Company**: Google
- **Location**: Remote
- **Description**: [Full Job Description text]
- **URL**: [Link to apply]