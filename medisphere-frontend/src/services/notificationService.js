// src/services/notificationService.js
import api from './api';

const BASE = '/api/notifications';

export const notificationService = {
  /** GET /api/notifications — all notifications */
  getAll: () => api.get(BASE),

  /** GET /api/notifications/pending */
  getPending: () => api.get(`${BASE}/pending`),

  /** GET /api/notifications/patient/:patientId */
  getByPatient: (patientId) => api.get(`${BASE}/patient/${patientId}`),

  /** GET /api/notifications/alert/:alertId */
  getByAlert: (alertId) => api.get(`${BASE}/alert/${alertId}`),

  /** GET /api/notifications/:notificationId */
  getById: (notificationId) => api.get(`${BASE}/${notificationId}`),

  /** PUT /api/notifications/:notificationId/delivered */
  markDelivered: (notificationId) => api.put(`${BASE}/${notificationId}/delivered`),
};

export default notificationService;
