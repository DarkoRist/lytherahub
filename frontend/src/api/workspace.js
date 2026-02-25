import api from './client'

export const workspaceApi = {
  get: () => api.get('/api/workspace'),
  update: (data) => api.put('/api/workspace', data),
  listMembers: () => api.get('/api/workspace/members'),
  invite: (data) => api.post('/api/workspace/invite', data),
  updateMember: (id, data) => api.put(`/api/workspace/members/${id}`, data),
  removeMember: (id) => api.delete(`/api/workspace/members/${id}`),
}
