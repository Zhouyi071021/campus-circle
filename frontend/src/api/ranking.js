import apiClient from './index';
export const getRankings = (type) => apiClient.get(`/api/rankings/${type}`);