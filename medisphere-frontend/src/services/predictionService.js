import api from './api';

const PREDICTIONS_URL = '/api/predictions';

export const predictionService = {
  // POST /api/predictions
  createPrediction: (patientId) => api.post(PREDICTIONS_URL, { patientId }),
};

export default predictionService;
