import api from './client'

export const workspaceApi = {
  get: () => api.get('/workspace'),
  update: (data) => api.put('/workspace', data),
  listMembers: () => api.get('/workspace/members'),
  invite: (data) => api.post('/workspace/invite', data),
  updateMember: (id, data) => api.put(`/workspace/members/${id}`, data),
  removeMember: (id) => api.delete(`/workspace/members/${id}`),
}
