// src/services/consentService.js
import api from './api';

const CONSENTS_URL = '/api/consents';

export const consentService = {
  // GET /api/consents/{patientId}
  getConsent: (patientId) => api.get(`${CONSENTS_URL}/${patientId}`),

  // POST /api/consents
  createConsent: (consent) => api.post(CONSENTS_URL, consent),

  // PUT /api/consents/{id}
  updateConsent: (id, consent) => api.put(`${CONSENTS_URL}/${id}`, consent),

  // DELETE /api/consents/{id}
  deleteConsent: (id) => api.delete(`${CONSENTS_URL}/${id}`),

  // POST /api/consents/verify/{patientId}
  verifyConsent: (patientId) => api.post(`${CONSENTS_URL}/verify/${patientId}`),

  // POST /api/consents/revoke/{patientId}
  revokeConsent: (patientId) => api.post(`${CONSENTS_URL}/revoke/${patientId}`),
};

export default consentService;
