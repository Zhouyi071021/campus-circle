import apiClient from './index';

// 获取学校列表（支持搜索和分页）
export const getSchools = (params = {}) => {
  return apiClient.get('/api/schools', { params });
};

// 获取学校详情
export const getSchool = (id) => apiClient.get(`/api/schools/${id}`);

// 获取学校的帖子
export const getSchoolPosts = (id, page = 1, pageSize = 20) =>
  apiClient.get(`/api/schools/${id}/posts`, { params: { page, pageSize } });

// 获取学校的成员
export const getSchoolMembers = (id, page = 1, pageSize = 20) =>
  apiClient.get(`/api/schools/${id}/members`, { params: { page, pageSize } });

// 如果你之前定义了 getAllSchools，可以保持命名一致
export const getAllSchools = (params) => getSchools(params);