import apiClient from './index';

// 获取县区
export const getCounties = () => apiClient.get('/api/districts/counties');

// 根据县区获取区域
export const getDistricts = (countyId) => 
  apiClient.get(`/api/districts/districts/${countyId}`);

// 根据区域获取学校
export const getSchools = (districtId) => 
  apiClient.get(`/api/districts/schools/${districtId}`);