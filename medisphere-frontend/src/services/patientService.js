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

  // GET /api/patients/doctor/{doctorId}
  getPatientsByDoctor: (doctorId) => api.get(`${PATIENTS_URL}/doctor/${doctorId}`),

  // GET /api/patients/hospital/{hospitalId}
  getPatientsByHospital: (hospitalId) => api.get(`${PATIENTS_URL}/hospital/${hospitalId}`),

  // GET /api/patients/specialty/{specialty}
  getPatientsBySpecialty: (specialty) => api.get(`${PATIENTS_URL}/specialty/${specialty}`),

  // PUT /api/patients/{patientId}/assign
  assignPatient: (patientId, assignmentData) => api.put(`${PATIENTS_URL}/${patientId}/assign`, assignmentData),

  // POST /api/patients/seed
  seedPatients: () => api.post(`${PATIENTS_URL}/seed`),
};

export default patientService;
