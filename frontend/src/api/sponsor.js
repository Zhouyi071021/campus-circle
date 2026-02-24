import apiClient from './index';

// 获取公开赞助记录
export const getSponsors = (limit = 20) => 
  apiClient.get('/api/sponsors', { params: { limit } });

// 创建赞助记录（仅管理员或支付回调使用，一般前端不直接调用）
export const createSponsor = (data) => apiClient.post('/api/sponsors', data);