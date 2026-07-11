import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// ── Fact-Check API ──────────────────────────────────────────
export const factCheckAPI = {
  submit: (content, inputType = 'text', title) =>
    api.post('/factcheck', { content, inputType, title }),

  getById: (id) =>
    api.get(`/factcheck/${id}`),

  getHistory: (params = {}) =>
    api.get('/factcheck/history', { params }),

  bulkDelete: (ids) =>
    api.post('/factcheck/bulk-delete', { ids }),

  deleteSingle: (id) =>
    api.delete(`/factcheck/${id}`),

  deleteAllHistory: () =>
    api.delete('/factcheck/history/all'),
};

// ── Dashboard API ───────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecent: () => api.get('/dashboard/recent'),
};

// ── Health Check ────────────────────────────────────────────
export const healthCheck = () => api.get('/health');

export default api;
