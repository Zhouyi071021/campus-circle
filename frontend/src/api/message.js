import apiClient from './index';

// 获取会话列表
export const getConversations = () => apiClient.get('/api/messages/conversations');

// 获取某个会话的消息
export const getMessages = (conversationId, page = 1, pageSize = 20) => 
  apiClient.get(`/api/messages/conversations/${conversationId}/messages`, { params: { page, pageSize } });

// 发送消息
export const sendMessage = (data) => apiClient.post('/api/messages/send', data);

// 获取未读数
export const getUnreadCounts = () => apiClient.get('/api/messages/unread-counts');