import apiClient from './index';

// ==================== 商家服务接口 ====================

/**
 * 获取商家服务列表（支持分页、筛选、排序）
 * @param {Object} params - 查询参数 { page, pageSize, category, sort, order }
 * @returns {Promise}
 */
export const getBusinesses = (params) => apiClient.get('/api/businesses', { params });

/**
 * 获取单个服务详情
 * @param {number|string} id - 服务ID
 * @returns {Promise}
 */
export const getBusiness = (id) => apiClient.get(`/api/businesses/${id}`);

/**
 * 发布服务（需要商家权限）
 * @param {Object} data - 服务数据
 * @returns {Promise}
 */
export const createBusiness = (data) => apiClient.post('/api/businesses', data);

/**
 * 获取今日剩余发布次数（需要认证）
 * @returns {Promise}
 */
export const getRemainingToday = () => apiClient.get('/api/businesses/remaining-today');

// ==================== 商家申请接口 ====================

/**
 * 提交商家申请（普通用户申请成为商家）
 * @param {Object} data - 申请表单数据 { store_name, contact_phone, contact_wechat, business_license, reason }
 * @returns {Promise}
 */
export const submitBusinessApplication = (data) => apiClient.post('/api/business-applications', data);

/**
 * 获取当前用户的申请状态（用于判断是否已申请、审核中或通过）
 * @returns {Promise}
 */
export const getMyApplication = () => apiClient.get('/api/business-applications/my');