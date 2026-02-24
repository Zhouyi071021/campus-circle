import apiClient from './index';

// 公开接口
export const getAnnouncements = (page = 1, pageSize = 20) =>
  apiClient.get('/api/announcements', { params: { page, pageSize } });

export const getAnnouncement = (id) =>
  apiClient.get(`/api/announcements/${id}`);

// 管理员接口
export const getAdminAnnouncements = (params) =>
  apiClient.get('/api/announcements/admin/all', { params });

export const createAnnouncement = (data) =>
  apiClient.post('/api/announcements', data);

export const updateAnnouncement = (id, data) =>
  apiClient.put(`/api/announcements/${id}`, data);

export const deleteAnnouncement = (id) =>
  apiClient.delete(`/api/announcements/${id}`);