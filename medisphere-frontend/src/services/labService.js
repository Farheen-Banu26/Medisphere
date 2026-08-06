import api from './api';

const LABS_URL = '/api/labs';

export const labService = {
  getLabs: (patientId) => api.get(`${LABS_URL}/${patientId}`),
};

export default labService;
