import apiClient from './index';

// ---------- 用户接口 ----------
// 提交建议
export const createSuggestion = (data) => apiClient.post('/api/suggestions', data);

// 获取当前用户的建议列表
export const getMySuggestions = (page = 1, pageSize = 20) =>
  apiClient.get('/api/suggestions/my', { params: { page, pageSize } });

// 获取单个建议详情
export const getSuggestion = (id) => apiClient.get(`/api/suggestions/${id}`);

// ---------- 管理员接口 ----------
// 获取所有建议（支持状态筛选）
export const getAdminSuggestions = (params) =>
  apiClient.get('/api/suggestions/admin/all', { params });

// 管理员回复建议
export const replySuggestion = (id, reply) =>
  apiClient.put(`/api/suggestions/admin/${id}/reply`, { reply });

// 管理员关闭建议
export const closeSuggestion = (id) =>
  apiClient.put(`/api/suggestions/admin/${id}/close`);