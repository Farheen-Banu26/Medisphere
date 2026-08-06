// src/services/carePlanService.js
import api from './api';

const BASE_URL = '/api/careplans';

export const carePlanService = {
  // POST /api/careplans/generate
  generate: (data) => api.post(`${BASE_URL}/generate`, data),

  // GET /api/careplans/patient/{patientId}/today
  getPatientToday: (patientId) => api.get(`${BASE_URL}/patient/${patientId}/today`),

  // GET /api/careplans/patient/{patientId}/history
  getHistory: (patientId) => api.get(`${BASE_URL}/patient/${patientId}/history`),

  // PUT /api/careplans/{carePlanId}/approve
  approve: (carePlanId, data) => api.put(`${BASE_URL}/${carePlanId}/approve`, data),

  // PUT /api/careplans/{carePlanId}/reject
  reject: (carePlanId, data) => api.put(`${BASE_URL}/${carePlanId}/reject`, data),

  // PUT /api/careplans/{carePlanId}/doctor-notes
  updateDoctorNotes: (carePlanId, data) => api.put(`${BASE_URL}/${carePlanId}/doctor-notes`, data),

  // PUT /api/careplans/{carePlanId}/adherence
  updateAdherence: (carePlanId, data) => api.put(`${BASE_URL}/${carePlanId}/adherence`, data),

  // PUT /api/careplans/{carePlanId}/outcome
  updateOutcome: (carePlanId, data) => api.put(`${BASE_URL}/${carePlanId}/outcome`, data),

  // GET /api/careplans/{carePlanId}/outcome
  getOutcome: (carePlanId) => api.get(`${BASE_URL}/${carePlanId}/outcome`),

  // POST /api/careplans/{carePlanId}/comments
  addComment: (carePlanId, data) => api.post(`${BASE_URL}/${carePlanId}/comments`, data),

  // GET /api/careplans/{carePlanId}/comments
  getComments: (carePlanId) => api.get(`${BASE_URL}/${carePlanId}/comments`),

  // GET /api/careplans/dashboard/summary
  getDashboardSummary: () => api.get(`${BASE_URL}/dashboard/summary`),

  // GET /api/careplans/dashboard/risk-distribution
  getRiskDistribution: () => api.get(`${BASE_URL}/dashboard/risk-distribution`),

  // GET /api/careplans/dashboard/adherence-distribution
  getAdherenceDistribution: () => api.get(`${BASE_URL}/dashboard/adherence-distribution`),

  // GET /api/careplans/{carePlanId}/validation
  getValidation: (carePlanId) => api.get(`${BASE_URL}/${carePlanId}/validation`),

  // GET /api/careplans/{carePlanId}/audit
  getAudit: (carePlanId) => api.get(`${BASE_URL}/${carePlanId}/audit`),

  // GET /api/careplans/pending
  getPending: () => api.get(`${BASE_URL}/pending`),

  // GET /api/careplans/{patientId}
  getLatestByPatient: (patientId) => api.get(`${BASE_URL}/${patientId}`),
};

export default carePlanService;
