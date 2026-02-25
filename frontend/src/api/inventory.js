import api from './client'

export const inventoryApi = {
  levels: (params) => api.get('/inventory', { params }),
  movements: (params) => api.get('/inventory/movements', { params }),
  productMovements: (productId) => api.get(`/inventory/movements/${productId}`),
  adjust: (data) => api.post('/inventory/adjustment', data),
}
