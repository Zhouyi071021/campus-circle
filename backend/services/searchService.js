const supabase = require('../utils/supabase');

async function searchPosts(keyword, options = {}) {
  const { page = 1, pageSize = 20, schoolId, timeRange } = options;
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url),
      school:schools(id, name)
    `, { count: 'exact' })
    .eq('status', 'normal')
    .textSearch('title', keyword, { config: 'english' }) // 或使用ilike
    .or(`content.ilike.%${keyword}%`);
    // 简化：使用ilike
    // 实际可以使用全文检索，但ilike简单
  if (schoolId) query = query.eq('school_id', schoolId);
  if (timeRange === 'today') {
    const today = new Date(); today.setHours(0,0,0,0);
    query = query.gte('created_at', today.toISOString());
  } else if (timeRange === 'week') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte('created_at', weekAgo.toISOString());
  } else if (timeRange === 'month') {
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    query = query.gte('created_at', monthAgo.toISOString());
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });
  if (error) throw error;
  return { list: data, total: count };
}

async function searchUsers(keyword, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('users')
    .select('id, username, avatar_url, bio, followers_count', { count: 'exact' })
    .ilike('username', `%${keyword}%`)
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

async function searchSchools(keyword, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('schools')
    .select('id, name, logo_url', { count: 'exact' })
    .ilike('name', `%${keyword}%`)
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

async function searchBusinesses(keyword, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('businesses')
    .select(`
      *,
      user:users(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'approved')
    .ilike('title', `%${keyword}%`)
    .or(`description.ilike.%${keyword}%`)
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

module.exports = {
  searchPosts,
  searchUsers,
  searchSchools,
  searchBusinesses,
};