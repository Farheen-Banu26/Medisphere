// src/services/mockData.js

// ============================================================
// AUDIT LOGS — No backend API exists yet
// Replace auditLogService when backend implements GET /api/audit/logs
// ============================================================
export const mockAuditLogs = [
  { id: 'AL001', timestamp: '2026-07-09T04:30:00', user: 'dr.smith', role: 'DOCTOR', patientId: 'P001', action: 'VIEW_PATIENT', status: 'SUCCESS', details: 'Viewed patient record' },
  { id: 'AL002', timestamp: '2026-07-09T04:28:00', user: 'admin', role: 'ADMIN', patientId: 'P002', action: 'UPDATE_TWIN', status: 'SUCCESS', details: 'Updated health twin data' },
  { id: 'AL003', timestamp: '2026-07-09T04:25:00', user: 'dr.jones', role: 'DOCTOR', patientId: 'P003', action: 'GRANT_CONSENT', status: 'SUCCESS', details: 'Consent granted for data sharing' },
  { id: 'AL004', timestamp: '2026-07-09T04:20:00', user: 'nurse.anika', role: 'DOCTOR', patientId: 'P001', action: 'ADD_VITALS', status: 'SUCCESS', details: 'Vitals recorded' },
  { id: 'AL005', timestamp: '2026-07-09T04:15:00', user: 'dr.smith', role: 'DOCTOR', patientId: 'P005', action: 'FHIR_SYNC', status: 'SUCCESS', details: 'FHIR resources synchronized' },
  { id: 'AL006', timestamp: '2026-07-09T04:10:00', user: 'admin', role: 'ADMIN', patientId: 'P006', action: 'DELETE_PATIENT', status: 'WARNING', details: 'Patient record deleted' },
  { id: 'AL007', timestamp: '2026-07-09T04:05:00', user: 'dr.patel', role: 'DOCTOR', patientId: 'P007', action: 'REVOKE_CONSENT', status: 'SUCCESS', details: 'Consent revoked' },
  { id: 'AL008', timestamp: '2026-07-09T04:00:00', user: 'system', role: 'ADMIN', patientId: null, action: 'KAFKA_EVENT', status: 'SUCCESS', details: 'Vitals Kafka event processed' },
  { id: 'AL009', timestamp: '2026-07-09T03:55:00', user: 'dr.smith', role: 'DOCTOR', patientId: 'P009', action: 'VIEW_TWIN', status: 'SUCCESS', details: 'Digital twin viewed' },
  { id: 'AL010', timestamp: '2026-07-09T03:50:00', user: 'dr.jones', role: 'DOCTOR', patientId: 'P010', action: 'VALIDATE_FHIR', status: 'ERROR', details: 'FHIR validation failed — missing fields' },
  { id: 'AL011', timestamp: '2026-07-09T03:45:00', user: 'admin', role: 'ADMIN', patientId: 'P002', action: 'REGISTER_PATIENT', status: 'SUCCESS', details: 'New patient registered' },
  { id: 'AL012', timestamp: '2026-07-09T03:40:00', user: 'nurse.anika', role: 'DOCTOR', patientId: 'P003', action: 'ADD_VITALS', status: 'SUCCESS', details: 'Heart rate and SpO2 recorded' },
];

// ============================================================
// FHIR SYNC HISTORY — No backend API exists yet
// Replace when backend implements GET /api/fhir/sync-history
// ============================================================
export const mockFhirSyncHistory = [
  { id: 'SH001', timestamp: '2026-07-09T04:00:00', patientId: 'P001', resourceType: 'Patient', status: 'SYNCED', duration: '1.2s' },
  { id: 'SH002', timestamp: '2026-07-09T03:30:00', patientId: 'P002', resourceType: 'Observation', status: 'SYNCED', duration: '0.8s' },
  { id: 'SH003', timestamp: '2026-07-09T03:00:00', patientId: 'P003', resourceType: 'MedicationRequest', status: 'FAILED', duration: '2.1s' },
  { id: 'SH004', timestamp: '2026-07-09T02:30:00', patientId: 'P004', resourceType: 'Procedure', status: 'SYNCED', duration: '1.0s' },
  { id: 'SH005', timestamp: '2026-07-09T02:00:00', patientId: 'P005', resourceType: 'Patient', status: 'SYNCED', duration: '0.9s' },
];
