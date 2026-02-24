import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // 直接指向后端，避免代理干扰
  timeout: 10000,
});

// 请求拦截器：自动添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('📤 请求拦截器 - URL:', config.url);
    console.log('📤 请求拦截器 - Token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 请求拦截器 - 最终请求头:', config.headers);
    } else {
      console.warn('📤 请求拦截器 - 无 token');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;