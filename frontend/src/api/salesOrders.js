import api from './client'

export const salesOrdersApi = {
  list: (params) => api.get('/api/sales-orders', { params }),
  get: (id) => api.get(`/api/sales-orders/${id}`),
  create: (data) => api.post('/api/sales-orders', data),
  update: (id, data) => api.put(`/api/sales-orders/${id}`, data),
  delete: (id) => api.delete(`/api/sales-orders/${id}`),
  confirm: (id) => api.post(`/api/sales-orders/${id}/confirm`),
  fulfill: (id, data) => api.post(`/api/sales-orders/${id}/fulfill`, data),
}
