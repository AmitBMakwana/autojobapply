const dotenv = require('dotenv');
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = 'gemini-2.5-flash'; // Verified model name
const PRO_MODEL = 'gemini-2.5-flash'; // Use 2.5 Flash for speed and reliability

/**
 * Call the Gemini API using native fetch
 */
async function callGemini(contents, jsonSchema = null, model = DEFAULT_MODEL) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const body = {
    contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }],
  };

  if (jsonSchema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API Error: Status ${response.status}`, errorText);
    throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response or invalid structure.');
  }

  return jsonSchema ? JSON.parse(text) : text;
}

/**
 * Parse raw resume text into structured JSON profile
 */
async function parseResume(resumeText) {
  const prompt = `You are a resume parsing assistant. Parse the following raw resume text into a clean JSON structure containing contact info, professional summary, structured skills list, work history details, education, certifications, and projects.
Make sure to extract all text details accurately.

Raw Resume Text:
${resumeText}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING' },
      email: { type: 'STRING' },
      phone: { type: 'STRING' },
      location: { type: 'STRING' },
      summary: { type: 'STRING' },
      skills: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            category: { type: 'STRING', description: 'Skill category e.g. Frontend, Backend, Devops, Database, Languages' },
            items: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['category', 'items']
        }
      },
      workHistory: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            company: { type: 'STRING' },
            title: { type: 'STRING' },
            location: { type: 'STRING' },
            dates: { type: 'STRING' },
            bullets: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['company', 'title']
        }
      },
      education: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            institution: { type: 'STRING' },
            degree: { type: 'STRING' },
            field: { type: 'STRING' },
            dates: { type: 'STRING' },
            gpa: { type: 'STRING' },
            achievements: { type: 'STRING' }
          },
          required: ['institution']
        }
      },
      certifications: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      },
      projects: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            role: { type: 'STRING' },
            tech: { type: 'STRING', description: 'Tech stack used in this project' },
            link: { type: 'STRING' },
            github: { type: 'STRING' },
            dates: { type: 'STRING' },
            status: { type: 'STRING', description: 'Completed or In Progress or Archived' },
            description: { type: 'STRING' },
            highlights: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['name']
        }
      }
    },
    required: ['name', 'email', 'skills', 'workHistory']
  };

  return await callGemini(prompt, schema, DEFAULT_MODEL);
}

/**
 * Compare resume profile with job description to score fit and find gaps
 */
async function scoreJob(profile, jdText) {
  const prompt = `Compare the candidate's resume profile with the job description below. Score the candidate's overall fit out of 100, identify matched skills, missing key skills/keywords from the job description, and provide a concise, one-paragraph explanation of your rationale.

Candidate Resume Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jdText}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      fitScore: { type: 'INTEGER' },
      matchedSkills: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      },
      missingSkills: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      },
      rationale: { type: 'STRING' }
    },
    required: ['fitScore', 'matchedSkills', 'missingSkills', 'rationale']
  };

  return await callGemini(prompt, schema, DEFAULT_MODEL);
}

/**
 * Tailor the resume based on the target job description
 */
async function tailorResume(profile, jdText) {
  const prompt = `You are an expert resume writer and ATS optimization specialist.
Your task is to tailor the following resume profile to the target job description.

CRITICAL RULES:
1. ONLY use facts and experience already present in the candidate profile.
2. DO NOT invent or fabricate any experience, employers, dates, or skills.
3. Rephrase summary and adjust work history bullet points using relevant keywords from the job description to match ATS criteria.
4. Keep the overall professional experience matching the original timeline.

Candidate Resume Profile:
${JSON.stringify(profile, null, 2)}

Target Job Description:
${jdText}`;

  // We return a structured tailored object
  const schema = {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING' },
      workHistory: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            company: { type: 'STRING' },
            title: { type: 'STRING' },
            dates: { type: 'STRING' },
            bullets: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['company', 'title']
        }
      },
      skills: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      }
    },
    required: ['summary', 'workHistory', 'skills']
  };

  return await callGemini(prompt, schema, PRO_MODEL);
}

/**
 * Generate cover letter tailored to the job description
 */
async function generateCoverLetter(profile, jobTitle, company, jdText) {
  const prompt = `You are a professional cover letter writer. Write a tailored, highly professional 250-350 word cover letter.
Address it to the hiring team at "${company}" for the "${jobTitle}" position.
Use only the true details from the candidate's profile to align with the requirements in the job description.
Be enthusiastic, clear, and professional.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jdText}`;

  return await callGemini(prompt, null, PRO_MODEL);
}

module.exports = {
  parseResume,
  scoreJob,
  tailorResume,
  generateCoverLetter,
};
