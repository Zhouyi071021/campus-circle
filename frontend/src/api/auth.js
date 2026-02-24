import apiClient from './index';

// 用户名查重
export const checkUsername = (username) => 
  apiClient.get(`/api/users/check-username/${encodeURIComponent(username)}`);

// 注册
export const register = (userData) => 
  apiClient.post('/api/users/register', userData);

// 登录
export const login = (credentials) => 
  apiClient.post('/api/users/login', credentials);