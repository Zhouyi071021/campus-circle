import apiClient from './index';

// 获取学校列表（支持搜索和分页）
export const getSchools = (params = {}) => {
  return apiClient.get('/api/schools', { params });
};

// 如果你之前定义了 getAllSchools，可以保持命名一致
export const getAllSchools = (params) => getSchools(params);