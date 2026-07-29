// frontend/src/api.js

import axios from 'axios';

// During development → http://localhost:8000/api
// After deployment  → https://your-app.onrender.com/api
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000, // ✅ 5 minutes — agents need time to run
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const register    = (data) => api.post('/auth/register', data);
export const login       = (data) => api.post('/auth/login',    data);
export const logout      = ()     => api.post('/auth/logout');

// Projects
export const createProject = (data) => api.post('/projects/create', data);
export const listProjects  = ()     => api.get('/projects/list');
export const getProject    = (id)   => api.get(`/projects/${id}`);
export const deleteProject = (id)   => api.delete(`/projects/${id}`);

// Agents
export const runPipeline    = (projectId, projectDetails) =>
  api.post(`/agents/run/${projectId}`, projectDetails);
export const getAgentOutputs = (projectId) =>
  api.get(`/agents/outputs/${projectId}`);

export default api;