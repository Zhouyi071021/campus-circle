import apiClient from './index';

// 获取帖子评论列表
export const getComments = (postId, page = 1, pageSize = 20) =>
  apiClient.get(`/api/comments/post/${postId}`, { params: { page, pageSize } });

// 发表评论
export const createComment = (data) => apiClient.post('/api/comments', data);

// 删除评论
export const deleteComment = (id) => apiClient.delete(`/api/comments/${id}`);

// 点赞评论
export const likeComment = (id) => apiClient.post(`/api/comments/${id}/like`);

// 获取单条评论详情
export const getComment = (id) => apiClient.get(`/api/comments/${id}`);