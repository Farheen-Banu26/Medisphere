// src/services/fhirService.js
import api from './api';

const FHIR_URL = '/api/fhir';

export const fhirService = {
  // POST /api/fhir/connect
  connect: () => api.post(`${FHIR_URL}/connect`),

  // POST /api/fhir/importPatient
  importPatient: (patient) => api.post(`${FHIR_URL}/importPatient`, patient),

  // POST /api/fhir/validate
  validate: (patient) => api.post(`${FHIR_URL}/validate`, patient),

  // GET /api/fhir/resources
  getResources: () => api.get(`${FHIR_URL}/resources`),

  // GET /api/fhir/{patientId}
  getPatientResources: (patientId) => api.get(`${FHIR_URL}/${patientId}`),

  // POST /api/fhir/sync/{patientId}
  syncPatient: (patientId) => api.post(`${FHIR_URL}/sync/${patientId}`),

  // GET /api/fhir/sync-history
  getSyncHistory: (patientId) => api.get(`${FHIR_URL}/sync-history`, { params: patientId ? { patientId } : undefined }),
};

export default fhirService;
