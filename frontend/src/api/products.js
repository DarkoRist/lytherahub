import api from './client'

export const productsApi = {
  list: (params) => api.get('/api/products', { params }),
  get: (id) => api.get(`/api/products/${id}`),
  getStock: (id) => api.get(`/api/products/${id}/stock`),
  lowStock: () => api.get('/api/products/low-stock'),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
}

export const warehousesApi = {
  list: () => api.get('/api/warehouses'),
  create: (data) => api.post('/api/warehouses', data),
  update: (id, data) => api.put(`/api/warehouses/${id}`, data),
  delete: (id) => api.delete(`/api/warehouses/${id}`),
}
