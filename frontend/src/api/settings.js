import apiClient from './index';

// 获取用户设置
export const getUserSettings = () => apiClient.get('/api/settings');

// 更新用户设置
export const updateUserSettings = (data) => apiClient.put('/api/settings', data);

// 修改密码
export const changePassword = (data) => apiClient.put('/api/settings/password', data);

// 注销账号
export const deleteAccount = (data) => apiClient.delete('/api/settings/account', { data });

// 获取协议内容
export const getAgreement = (type) => apiClient.get(`/api/settings/agreement/${type}`);

// 发送短信验证码
export const sendSmsCaptcha = (phone) => apiClient.post('/api/settings/send-sms', { phone });

// 绑定手机号
export const bindPhone = (data) => apiClient.post('/api/settings/bind-phone', data);

// 发送邮箱验证码
export const sendEmailCaptcha = (email) => apiClient.post('/api/settings/send-email-captcha', { email });

// 绑定邮箱
export const bindEmail = (data) => apiClient.post('/api/settings/bind-email', data);
// 黑名单管理
export const getBlacklist = () => apiClient.get('/api/settings/blacklist');
export const removeBlacklist = (userId) => apiClient.delete(`/api/settings/blacklist/${userId}`);
export const blockUser = (userId) => apiClient.post(`/api/settings/blacklist/${userId}`);
// 登录记录（如果需要）
export const getLoginHistory = () => apiClient.get('/api/settings/login-history');