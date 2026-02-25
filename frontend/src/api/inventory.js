import api from './client'

export const inventoryApi = {
  levels: (params) => api.get('/api/inventory', { params }),
  movements: (params) => api.get('/api/inventory/movements', { params }),
  productMovements: (productId) => api.get(`/api/inventory/movements/${productId}`),
  adjust: (data) => api.post('/api/inventory/adjustment', data),
}
