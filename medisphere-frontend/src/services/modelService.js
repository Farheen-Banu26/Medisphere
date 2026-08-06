import api from './api';

const MODELS_URL = '/api/models';

export const modelService = {
  getAllModels: () => api.get(MODELS_URL),
  getModelById: (modelId) => api.get(`${MODELS_URL}/${modelId}`),
  getActiveModel: () => api.get(`${MODELS_URL}/active`),
  createModel: (model) => api.post(MODELS_URL, model),
  updateModel: (modelId, model) => api.put(`${MODELS_URL}/${modelId}`, model),
  deleteModel: (modelId) => api.delete(`${MODELS_URL}/${modelId}`),
  activateModel: (modelId) => api.put(`${MODELS_URL}/${modelId}/activate`),
};

export default modelService;
