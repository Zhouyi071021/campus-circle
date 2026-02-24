import apiClient from './index';

// 获取待审核申请列表
export const getPendingApplications = (page, pageSize) =>
  apiClient.get('/api/business-applications/pending', { params: { page, pageSize } });

// 审核申请
export const reviewApplication = (id, status, reject_reason) =>
  apiClient.put(`/api/business-applications/${id}/review`, { status, reject_reason });

// 获取当前用户的申请状态（已在 Business.vue 中使用）
export const getMyApplication = () => apiClient.get('/api/business-applications/my');