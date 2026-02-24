import apiClient from './index';

export const getNotifications = (page = 1, pageSize = 20) =>
  apiClient.get('/api/notifications', { params: { page, pageSize } });

export const getUnreadCount = () => apiClient.get('/api/notifications/unread-count');

export const markAsRead = (id) => apiClient.put(`/api/notifications/${id}/read`);

export const markAllAsRead = () => apiClient.put('/api/notifications/read-all');