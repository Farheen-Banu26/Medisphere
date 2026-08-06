// src/services/vitalsService.js
import api from './api';

const VITALS_URL = '/api/vitals';

export const vitalsService = {
  // GET /api/vitals
  getAllVitals: () => api.get(VITALS_URL),

  // GET /api/vitals/{patientId}
  getVitalsByPatient: (patientId) => api.get(`${VITALS_URL}/${patientId}`),

  // GET /api/vitals/latest/{patientId}
  getLatestVitals: (patientId) => api.get(`${VITALS_URL}/latest/${patientId}`),

  // POST /api/vitals
  addVitals: (vital) => api.post(VITALS_URL, vital),

  // DELETE /api/vitals/{id}
  deleteVitals: (id) => api.delete(`${VITALS_URL}/${id}`),
};

export default vitalsService;
