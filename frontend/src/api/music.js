import apiClient from './index';

// 获取音乐列表（支持过滤状态）
export const getMusicList = (params = {}) => {
  return apiClient.get('/api/music', { params });
};

// 获取单首音乐详情
export const getMusicById = (id) => {
  return apiClient.get(`/api/music/${id}`);
};