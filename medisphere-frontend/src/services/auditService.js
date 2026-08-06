import api from './api';

const AUDIT_URL = '/api/audit';

export const auditService = {
  getLogs: () => api.get(`${AUDIT_URL}/logs`),
};

export default auditService;
