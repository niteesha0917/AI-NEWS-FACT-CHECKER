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
    console.error('API request failed:', error);
    let message = error.response?.data?.error || error.response?.data?.message;

    if (!message) {
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          message = 'Request timed out. Please make sure the backend is running and reachable on port 5000.';
        } else {
          message = 'Backend server is unreachable. Please make sure the backend is running on port 5000 (run start.bat to start both servers).';
        }
      } else {
        message = error.response?.statusText || error.message || 'Request failed';
      }
    }

    return Promise.reject(new Error(message));
  }
);

// ── Auth API ────────────────────────────────────────────────
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  sync: (profile) => api.post('/auth/sync', profile),
};

// ── Fact-Check API ──────────────────────────────────────────
export const factCheckAPI = {
  submit: (content, inputType = 'text', title, userInfo = {}) =>
    api.post('/factcheck', { content, inputType, title, ...userInfo }),

  summarize: (content, category) =>
    api.post('/factcheck/summarize', { content, category }),

  searchEvidence: (q, category) =>
    api.get('/factcheck/evidence/search', { params: { q, category } }),

  getById: (id) =>
    api.get(`/factcheck/${id}`),

  getHistory: (params = {}) =>
    api.get('/factcheck/history', { params }),

  getLiveFeed: (params = {}) =>
    api.get('/factcheck/live-feed', { params }),

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
