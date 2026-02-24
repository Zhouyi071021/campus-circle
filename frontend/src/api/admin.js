import apiClient from './index';

export const getAdminStats = () => apiClient.get('/api/admin/dashboard/stats');
export const getAdminTrends = () => apiClient.get('/api/admin/dashboard/trends');

// 帖子管理（原 pending 改为 manage）
export const getManagePosts = (page, pageSize) => 
  apiClient.get('/api/admin/posts/manage', { params: { page, pageSize } });
export const deletePost = (id, reason) => 
  apiClient.put(`/api/admin/posts/${id}`, { status: 'rejected', reject_reason: reason });

// 用户管理
export const getUsers = (params) => apiClient.get('/api/admin/users', { params });
export const updateUserStatus = (id, data) => apiClient.put(`/api/admin/users/${id}/status`, data);

// 商家审核（保持不变）
export const getPendingBusinesses = (page, pageSize) => apiClient.get('/api/admin/businesses/pending', { params: { page, pageSize } });
export const approveBusiness = (id) => apiClient.put(`/api/admin/businesses/${id}`, { status: 'approved' });
export const rejectBusiness = (id, reason) => apiClient.put(`/api/admin/businesses/${id}`, { status: 'rejected', reject_reason: reason });
// 获取所有商家服务（支持状态筛选）
export const getBusinesses = (params) => apiClient.get('/api/admin/businesses', { params });
// 获取所有商家申请（支持状态筛选）
export const getApplications = (params) => apiClient.get('/api/admin/applications', { params });

// 审核申请（复用已有的 reviewApplication，但路径已在 businessApplicationRoutes 中定义）
// 注意：此接口仍保留在 businessApplicationRoutes 中，这里可以直接使用原来的函数
// 或者为了统一，也可以在 admin.js 中重新导出
export { reviewApplication } from './businessApplication';
// 删除商家申请
export const deleteApplication = (id) => apiClient.delete(`/api/admin/applications/${id}`);

// 社区审核（保持不变）
export const getPendingCommunities = (page, pageSize) => apiClient.get('/api/admin/communities/pending', { params: { page, pageSize } });
export const approveCommunity = (id) => apiClient.put(`/api/admin/communities/${id}`, { status: 'approved' });
export const rejectCommunity = (id, reason) => apiClient.put(`/api/admin/communities/${id}`, { status: 'rejected', reject_reason: reason });
// 获取所有社区（支持状态筛选）
export const getCommunities = (params) => apiClient.get('/api/admin/communities', { params });

// 学校管理
export const getSchools = () => apiClient.get('/api/admin/schools');
export const createSchool = (data) => apiClient.post('/api/admin/schools', data);
export const updateSchool = (id, data) => apiClient.put(`/api/admin/schools/${id}`, data);
export const deleteSchool = (id) => apiClient.delete(`/api/admin/schools/${id}`);

// 操作日志
export const getAdminLogs = (page, pageSize) => apiClient.get('/api/admin/logs', { params: { page, pageSize } });

// 评论管理
export const getManageComments = (page, pageSize) => 
  apiClient.get('/api/admin/comments/manage', { params: { page, pageSize } });
export const deleteComment = (id, reason) => 
  apiClient.put(`/api/admin/comments/${id}`, { status: 'rejected', reject_reason: reason });

// 地区管理
export const getDistricts = (params) => apiClient.get('/api/admin/districts', { params });
export const createDistrict = (data) => apiClient.post('/api/admin/districts', data);
export const updateDistrict = (id, data) => apiClient.put(`/api/admin/districts/${id}`, data);
export const deleteDistrict = (id) => apiClient.delete(`/api/admin/districts/${id}`);

// 广告管理
export const getAds = () => apiClient.get('/api/admin/ads');
export const createAd = (data) => apiClient.post('/api/admin/ads', data);
export const updateAd = (id, data) => apiClient.put(`/api/admin/ads/${id}`, data);
export const deleteAd = (id) => apiClient.delete(`/api/admin/ads/${id}`);

// 背景音乐管理
export const getMusicList = () => apiClient.get('/api/admin/music');
export const createMusic = (data) => apiClient.post('/api/admin/music', data);
export const updateMusic = (id, data) => apiClient.put(`/api/admin/music/${id}`, data);
export const deleteMusic = (id) => apiClient.delete(`/api/admin/music/${id}`);

// 协议管理
export const getAgreements = (params) => apiClient.get('/api/admin/agreements', { params });
export const createAgreement = (data) => apiClient.post('/api/admin/agreements', data);
export const updateAgreement = (id, data) => apiClient.put(`/api/admin/agreements/${id}`, data);
export const deleteAgreement = (id) => apiClient.delete(`/api/admin/agreements/${id}`);
export const setCurrentAgreement = (id, data) => apiClient.put(`/api/admin/agreements/${id}/set-current`, data);

// 管理员管理
export const getAdmins = () => apiClient.get('/api/admin/admins');
export const addAdmin = (data) => apiClient.post('/api/admin/admins', data);
export const removeAdmin = (userId) => apiClient.delete(`/api/admin/admins/${userId}`);

// 搜索用户（用于添加管理员时选择用户）
export const searchUsers = (params) => apiClient.get('/api/admin/users', { params });