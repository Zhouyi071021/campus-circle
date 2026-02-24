import apiClient from './index';

// 发布帖子
export const createPost = (data) => apiClient.post('/api/posts', data);

// 获取帖子列表
export const getPosts = (params) => apiClient.get('/api/posts', { params });

// 获取帖子详情
export const getPost = (id) => apiClient.get(`/api/posts/${id}`);

// 获取某月的帖子统计
export const getPostCountsByMonth = (year, month) => 
  apiClient.get(`/api/posts/calendar/${year}/${month}`);

// 获取某天的帖子列表
export const getPostsByDate = (date, page = 1, pageSize = 20) => 
  apiClient.get(`/api/posts/date/${date}`, { params: { page, pageSize } });

// 点赞帖子
export const likePost = (id) => apiClient.post(`/api/posts/${id}/like`);

// 收藏帖子
export const collectPost = (id) => apiClient.post(`/api/posts/${id}/collect`);

// 删除帖子
export const deletePost = (id) => apiClient.delete(`/api/posts/${id}`);
// 根据标签获取帖子列表
export const getPostsByTag = (tag, page = 1, pageSize = 20) =>
  apiClient.get(`/api/posts/tag/${encodeURIComponent(tag)}`, { params: { page, pageSize } });