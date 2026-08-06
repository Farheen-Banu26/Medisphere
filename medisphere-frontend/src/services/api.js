// src/services/api.js
// Central Axios instance. Auth token attachment is ready but skipped until Keycloak is integrated.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach Bearer token when auth is enabled
api.interceptors.request.use(
  (config) => {
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
    if (!skipAuth) {
      const token = localStorage.getItem('medisphere_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('MediSphere: Unauthorized — token may be expired.');
      // Future: trigger Keycloak refresh or redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
