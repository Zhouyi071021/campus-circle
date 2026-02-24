import apiClient from './index';

// 获取用户公开资料
export const getUserProfile = (userId) => apiClient.get(`/api/users/${userId}`);

// 检查是否已关注
export const checkFollowStatus = (targetUserId) => 
  apiClient.get(`/api/users/${targetUserId}/follow-status`);

// 关注用户
export const followUser = (targetUserId) => 
  apiClient.post(`/api/users/${targetUserId}/follow`);

// 取消关注
export const unfollowUser = (targetUserId) => 
  apiClient.delete(`/api/users/${targetUserId}/follow`);

// 获取关注列表（公开）
export const getFollowing = (userId, page = 1, pageSize = 20) =>
  apiClient.get(`/api/users/${userId}/following`, { params: { page, pageSize } });

// 获取粉丝列表（公开）
export const getFollowers = (userId, page = 1, pageSize = 20) =>
  apiClient.get(`/api/users/${userId}/followers`, { params: { page, pageSize } });

// 获取当前用户的关注列表（带互关状态，需认证）
export const getMyFollowing = (page = 1, pageSize = 20) =>
  apiClient.get('/api/users/me/following', { params: { page, pageSize } });

// 获取当前用户的粉丝列表（带互关状态，需认证）
export const getMyFollowers = (page = 1, pageSize = 20) =>
  apiClient.get('/api/users/me/followers', { params: { page, pageSize } });

// 获取用户帖子列表（公开）
export const getUserPosts = (userId, page = 1, pageSize = 20) =>
  apiClient.get(`/api/users/${userId}/posts`, { params: { page, pageSize } });

// 获取用户评论列表（公开）
export const getUserComments = (userId, page = 1, pageSize = 20) =>
  apiClient.get(`/api/users/${userId}/comments`, { params: { page, pageSize } });

// 获取用户收藏列表（公开）
export const getUserCollections = (userId, page = 1, pageSize = 20) =>
  apiClient.get(`/api/users/${userId}/collections`, { params: { page, pageSize } });

// 获取当前用户的收藏列表（需认证）
export const getMyCollections = (page = 1, pageSize = 20) =>
  apiClient.get('/api/users/collections', { params: { page, pageSize } });

// 获取当前用户的评论列表（需认证）
export const getMyComments = (page = 1, pageSize = 20) =>
  apiClient.get('/api/users/comments', { params: { page, pageSize } });

// 获取当前用户的帖子列表（需认证）
export const getMyPosts = (page = 1, pageSize = 20) =>
  apiClient.get('/api/users/posts', { params: { page, pageSize } });

// 更新用户资料（需认证）
export const updateProfile = (data) => apiClient.put('/api/users/profile', data);

// 删除评论（需认证）  <-- 新增
export const deleteComment = (commentId) => apiClient.delete(`/api/comments/${commentId}`);