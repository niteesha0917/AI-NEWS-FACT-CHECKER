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
