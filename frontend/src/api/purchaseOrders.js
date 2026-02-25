import api from './client'

export const purchaseOrdersApi = {
  list: (params) => api.get('/purchase-orders', { params }),
  get: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  send: (id) => api.post(`/purchase-orders/${id}/send`),
  receive: (id, data) => api.post(`/purchase-orders/${id}/receive`, data),
}
