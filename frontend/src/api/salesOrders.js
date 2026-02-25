import api from './client'

export const salesOrdersApi = {
  list: (params) => api.get('/sales-orders', { params }),
  get: (id) => api.get(`/sales-orders/${id}`),
  create: (data) => api.post('/sales-orders', data),
  update: (id, data) => api.put(`/sales-orders/${id}`, data),
  delete: (id) => api.delete(`/sales-orders/${id}`),
  confirm: (id) => api.post(`/sales-orders/${id}/confirm`),
  fulfill: (id, data) => api.post(`/sales-orders/${id}/fulfill`, data),
}
