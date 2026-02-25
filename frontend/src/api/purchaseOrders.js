import api from './client'

export const purchaseOrdersApi = {
  list: (params) => api.get('/api/purchase-orders', { params }),
  get: (id) => api.get(`/api/purchase-orders/${id}`),
  create: (data) => api.post('/api/purchase-orders', data),
  update: (id, data) => api.put(`/api/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/api/purchase-orders/${id}`),
  send: (id) => api.post(`/api/purchase-orders/${id}/send`),
  receive: (id, data) => api.post(`/api/purchase-orders/${id}/receive`, data),
}
