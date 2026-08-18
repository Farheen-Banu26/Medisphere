// src/services/api.js
// Central Axios instance. Attach Keycloak Bearer token dynamically & handle automatic token refresh.
import axios from 'axios';
import keycloak from '../auth/keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach Bearer token and proactively refresh if expired
api.interceptors.request.use(
  async (config) => {
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
    if (!skipAuth) {
      if (keycloak && keycloak.token) {
        try {
          if (keycloak.isTokenExpired && keycloak.isTokenExpired(30)) {
            await keycloak.updateToken(30);
          }
        } catch (err) {
          console.warn('MediSphere: Proactive Keycloak token refresh warning:', err);
        }
        config.headers.Authorization = `Bearer ${keycloak.token}`;
        localStorage.setItem('medisphere_token', keycloak.token);
      } else {
        const token = localStorage.getItem('medisphere_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally, refresh token, and retry request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn('MediSphere: 401 Unauthorized — attempting Keycloak token refresh and request retry...');
      if (keycloak && keycloak.authenticated) {
        try {
          const refreshed = await keycloak.updateToken(30);
          if (refreshed || keycloak.token) {
            localStorage.setItem('medisphere_token', keycloak.token);
            originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error('MediSphere: Keycloak token refresh failed on 401 retry:', refreshErr);
          keycloak.logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
