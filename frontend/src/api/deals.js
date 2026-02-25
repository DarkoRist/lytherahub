import api from './client'

export const dealsApi = {
  list: (params) => api.get('/deals', { params }),
  pipeline: () => api.get('/deals/pipeline'),
  get: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  moveStage: (id, data) => api.put(`/deals/${id}/stage`, data),
  delete: (id) => api.delete(`/deals/${id}`),
}

export const activitiesApi = {
  list: (entityType, entityId) => api.get('/activities', { params: { entity_type: entityType, entity_id: entityId } }),
  create: (data) => api.post('/activities', data),
  delete: (id) => api.delete(`/activities/${id}`),
}
