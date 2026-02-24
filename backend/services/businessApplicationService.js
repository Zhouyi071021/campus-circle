const supabase = require('../utils/supabase');

// 提交申请
async function createApplication(data) {
  const { data: result, error } = await supabase
    .from('business_applications')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

// 获取用户的申请状态
async function getUserApplication(userId) {
  const { data, error } = await supabase
    .from('business_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 管理员获取待审核申请列表
async function getPendingApplications(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('business_applications')
    .select(`
      *,
      user:users(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 审核申请
async function reviewApplication(id, status, reject_reason = null) {
  const updates = { status, updated_at: new Date() };
  if (reject_reason) updates.reject_reason = reject_reason;
  const { data, error } = await supabase
    .from('business_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  // 如果审核通过，更新用户的 role 为 'business'
  if (status === 'approved') {
    await supabase
      .from('users')
      .update({ role: 'business' })
      .eq('id', data.user_id);
  }
  return data;
}

module.exports = {
  createApplication,
  getUserApplication,
  getPendingApplications,
  reviewApplication,
};