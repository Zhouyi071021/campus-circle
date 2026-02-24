import apiClient from './index';

export const comprehensiveSearch = (q) => apiClient.get('/api/search/comprehensive', { params: { q } });

export const searchPosts = (params) => apiClient.get('/api/search/posts', { params });
export const searchUsers = (params) => apiClient.get('/api/search/users', { params });
export const searchSchools = (params) => apiClient.get('/api/search/schools', { params });
export const searchBusinesses = (params) => apiClient.get('/api/search/businesses', { params });