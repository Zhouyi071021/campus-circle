const supabase = require('../utils/supabase');

// 创建建议（原有）
async function createSuggestion(data) {
  const { data: result, error } = await supabase
    .from('suggestions')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

// 获取用户的建议列表（原有）
async function getUserSuggestions(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('suggestions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 获取单个建议详情（原有）
async function getSuggestionById(id) {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// 管理员回复建议（原有）
async function replySuggestion(id, reply) {
  const { data, error } = await supabase
    .from('suggestions')
    .update({ reply, status: 'replied', replied_at: new Date() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========== 新增管理员方法 ==========
// 获取所有建议（支持分页和状态筛选）
async function getAllSuggestions({ page = 1, pageSize = 20, status } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('suggestions')
    .select('*, user:users(id, username, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 管理员关闭建议
async function closeSuggestion(id) {
  const { data, error } = await supabase
    .from('suggestions')
    .update({ status: 'closed' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  createSuggestion,
  getUserSuggestions,
  getSuggestionById,
  replySuggestion,
  getAllSuggestions,
  closeSuggestion,
};