const supabase = require('../utils/supabase');

// 获取商家服务列表（支持筛选、排序）
async function getBusinesses(options) {
  const {
    page = 1,
    pageSize = 20,
    category,
    sort = 'created_at', // 排序字段：created_at, view_count, rating
    order = 'desc',
    status = 'approved'
  } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('businesses')
    .select(`
      *,
      user:users(id, username, avatar_url, role)
    `, { count: 'exact' })
    .eq('status', status);

  if (category) {
    query = query.eq('category', category);
  }

  query = query.order(sort, { ascending: order === 'asc' });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 获取单个服务详情
async function getBusinessById(id) {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      user:users(id, username, avatar_url, role)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// 创建服务（商家专用）
async function createBusiness(businessData) {
  const { data, error } = await supabase
    .from('businesses')
    .insert([businessData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 更新服务
async function updateBusiness(id, updates) {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 获取用户今日已发布数量（用于限制每天1篇）
async function getUserTodayCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());
  if (error) throw error;
  return count;
}

module.exports = {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  getUserTodayCount,
};