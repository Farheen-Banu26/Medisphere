// src/services/alertService.js
import api from './api';

const BASE = '/api/alerts';

export const alertService = {
  /** GET /api/alerts — all alerts */
  getAll: () => api.get(BASE),

  /** GET /api/alerts/active — only NEW/SENT/DELIVERED/ACKNOWLEDGED */
  getActive: () => api.get(`${BASE}/active`),

  /** GET /api/alerts/patient/:patientId */
  getByPatient: (patientId) => api.get(`${BASE}/patient/${patientId}`),

  /** GET /api/alerts/:alertId */
  getById: (alertId) => api.get(`${BASE}/${alertId}`),

  /** PUT /api/alerts/:alertId/acknowledge  { acknowledgedBy } */
  acknowledge: (alertId, acknowledgedBy) =>
    api.put(`${BASE}/${alertId}/acknowledge`, { acknowledgedBy }),

  /** PUT /api/alerts/:alertId/close */
  close: (alertId) => api.put(`${BASE}/${alertId}/close`),

  /** PUT /api/alerts/:alertId/sent  (internal — called by notification-service, exposed for completeness) */
  markSent: (alertId) => api.put(`${BASE}/${alertId}/sent`),

  /** PUT /api/alerts/:alertId/delivered */
  markDelivered: (alertId) => api.put(`${BASE}/${alertId}/delivered`),
};

export default alertService;
