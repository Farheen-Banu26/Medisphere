// src/services/twinService.js
import api from './api';

const TWINS_URL = '/api/twins';

export const twinService = {
  // GET /api/twins/{patientId}
  getTwin: (patientId) => api.get(`${TWINS_URL}/${patientId}`),

  // POST /api/twins
  createTwin: (twin) => api.post(TWINS_URL, twin),

  // PUT /api/twins/{patientId}
  updateTwin: (patientId, twin) => api.put(`${TWINS_URL}/${patientId}`, twin),

  // GET /api/twins/{patientId}/health-score
  getHealthScore: (patientId) => api.get(`${TWINS_URL}/${patientId}/health-score`),

  // GET /api/twins/summary/{patientId}  — Patient 360 Summary
  getPatient360Summary: (patientId) => api.get(`${TWINS_URL}/summary/${patientId}`),
};

export default twinService;
