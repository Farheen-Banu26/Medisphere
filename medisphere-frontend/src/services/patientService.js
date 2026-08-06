// src/services/patientService.js
import api from './api';

const PATIENTS_URL = '/api/patients';

export const patientService = {
  // GET /api/patients
  getAllPatients: () => api.get(PATIENTS_URL),

  // GET /api/patients/{patientId}
  getPatientById: (patientId) => api.get(`${PATIENTS_URL}/${patientId}`),

  // POST /api/patients
  registerPatient: (patient) => api.post(PATIENTS_URL, patient),

  // PUT /api/patients/{patientId}
  updatePatient: (patientId, patient) => api.put(`${PATIENTS_URL}/${patientId}`, patient),

  // DELETE /api/patients/{id}
  deletePatient: (id) => api.delete(`${PATIENTS_URL}/${id}`),
};

export default patientService;
