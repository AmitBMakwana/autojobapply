const API_BASE = 'http://127.0.0.1:3001/api';

export async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      parsedErr = { error: errText };
    }
    throw new Error(parsedErr.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Master Profile (legacy single profile)
  getProfile: () => request('/resume/profile'),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Resume upload failed.');
      return res.json();
    });
  },
  updateProfile: (profile) => request('/resume/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  }),

  // Multi-version Resumes
  listResumes: () => request('/resumes'),
  createResume: (name) => request('/resumes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  getResume: (id) => request(`/resumes/${id}`),
  updateResume: (id, data) => request(`/resumes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  duplicateResume: (id) => request(`/resumes/${id}/duplicate`, { method: 'POST' }),
  setDefaultResume: (id) => request(`/resumes/${id}/set-default`, { method: 'PUT' }),
  uploadToResume: (id, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return fetch(`${API_BASE}/resumes/${id}/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed.');
      return res.json();
    });
  },

  // Jobs
  getJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs?${query}`);
  },
  updateJob: (id, data) => request(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  triggerAggregation: (title, location) => request('/jobs/trigger-aggregation', {
    method: 'POST',
    body: JSON.stringify({ title, location }),
  }),
  scoreJob: (jobId) => request(`/score/${jobId}`, { method: 'POST' }),

  // Tailoring
  tailorJob: (jobId) => request(`/tailor/${jobId}`, { method: 'POST' }),
  getTailoredDocs: (jobId) => request(`/tailor/${jobId}`),
  downloadDocUrl: (jobId, docType, format) => `${API_BASE}/tailor/${jobId}/download/${docType}/${format}`,

  // Tracker Kanban Board
  getKanbanBoard: () => request('/tracker/board'),
  getStats: () => request('/tracker/stats'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};
