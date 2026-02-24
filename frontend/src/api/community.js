import apiClient from './index';

// 获取社区列表
export const getCommunities = (params) => apiClient.get('/api/communities', { params });

// 获取单个社区详情
export const getCommunity = (id) => apiClient.get(`/api/communities/${id}`);

// 创建社区
export const createCommunity = (data) => apiClient.post('/api/communities', data);

// 加入社区
export const joinCommunity = (id) => apiClient.post(`/api/communities/${id}/join`);

// 退出社区
export const leaveCommunity = (id) => apiClient.post(`/api/communities/${id}/leave`);

// 检查是否已加入
export const checkMember = (id) => apiClient.get(`/api/communities/${id}/is-member`);

// 获取社区成员列表
export const getCommunityMembers = (id, page = 1, pageSize = 20) =>
  apiClient.get(`/api/communities/${id}/members`, { params: { page, pageSize } });

// 获取社区帖子列表
export const getCommunityPosts = (id, page = 1, pageSize = 20) =>
  apiClient.get(`/api/communities/${id}/posts`, { params: { page, pageSize } });

// 在社区内发帖
export const createCommunityPost = (id, data) =>
  apiClient.post(`/api/communities/${id}/posts`, data);

// 删除社区帖子
export const deleteCommunityPost = (postId) =>
  apiClient.delete(`/api/community-posts/${postId}`);

// 删除社区（仅创建者）
export const deleteCommunity = (id) => apiClient.delete(`/api/communities/${id}`);