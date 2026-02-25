import api from './client'

export const signalsApi = {
  list: (params) => api.get('/signals', { params }),
  summary: () => api.get('/signals/summary'),
  refresh: () => api.post('/signals/refresh'),
  markRead: (id) => api.post(`/signals/${id}/read`),
  dismiss: (id) => api.post(`/signals/${id}/dismiss`),
  dismissAll: () => api.post('/signals/dismiss-all'),
}
