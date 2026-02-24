const supabase = require('../utils/supabase');

// 辅助函数：如果帖子是匿名的，移除用户信息
function processPost(post) {
  if (post && post.is_anonymous) {
    post.user = null;  // 完全隐藏作者信息
  }
  return post;
}

// 辅助函数：处理帖子列表
function processPosts(posts) {
  return posts.map(post => processPost(post));
}

/**
 * 创建帖子
 * @param {Object} postData - 帖子数据
 * @returns {Object} 创建的帖子
 */
async function createPost(postData) {
  const { data, error } = await supabase
    .from('posts')
    .insert([postData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * 获取帖子列表（支持分页、学校筛选）
 * @param {Object} options - 查询参数
 * @param {number} options.page - 页码（从1开始）
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.schoolFilter - 学校筛选类型：本校、同区、同市、所有、自定义
 * @param {number[]} options.customSchoolIds - 自定义学校ID数组
 * @returns {Object} { list, total }
 */
async function getPosts(options) {
  const { page = 1, pageSize = 20, schoolFilter = 'all', customSchoolIds = [] } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url),
      school:schools(id, name, logo_url)
    `, { count: 'exact' })
    .eq('status', 'normal')
    .order('created_at', { ascending: false });

  // 学校筛选逻辑
  if (schoolFilter === 'school' && options.userSchoolId) {
    query = query.eq('school_id', options.userSchoolId);
  } else if (schoolFilter === 'district' && options.userDistrictId) {
    // 同区：需要先查出该区域下的所有学校ID，然后在帖子中筛选
    // 简化：先不实现复杂关联，先用学校ID列表
    // 这里需要传入该区域的所有学校ID，可以在上层服务中先查询
    // 我们稍后会在路由层处理
  } else if (schoolFilter === 'city' && options.userCityId) {
    // 同市：类似区域
  } else if (schoolFilter === 'custom' && customSchoolIds.length > 0) {
    query = query.in('school_id', customSchoolIds);
  }
  // 'all' 不做筛选

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  // 处理匿名帖子：移除 user 信息
  const list = processPosts(data);
  return { list, total: count };
}

/**
 * 根据ID获取帖子详情
 * @param {number} postId 
 * @returns {Object} 帖子详情（含作者、学校信息）
 */
async function getPostById(id) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url, title),
      school:schools(id, name, logo_url)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  // 处理匿名帖子
  return processPost(data);
}

/**
 * 更新帖子（浏览量、点赞数等）
 * @param {number} postId 
 * @param {Object} updates 
 */
async function updatePost(postId, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * 删除帖子（软删除）
 * @param {number} postId 
 */
async function deletePost(postId) {
  const { error } = await supabase
    .from('posts')
    .update({ status: 'deleted' })
    .eq('id', postId);
  if (error) throw error;
  return true;
}

/**
 * 获取指定日期的帖子列表
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
async function getPostsByDate(date, page = 1, pageSize = 20) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url),
      school:schools(id, name, logo_url)
    `, { count: 'exact' })
    .eq('status', 'normal')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const list = processPosts(data);
  return { list, total: count };
}

/**
 * 获取一个月内每天有帖子的数量（用于日历标记）
 * 需要先在 Supabase 中创建函数：
 * CREATE OR REPLACE FUNCTION get_post_counts_by_month(year int, month int)
 * RETURNS TABLE (date date, count bigint) 
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT created_at::date, COUNT(*)
 *   FROM posts
 *   WHERE status = 'normal'
 *     AND EXTRACT(YEAR FROM created_at) = year
 *     AND EXTRACT(MONTH FROM created_at) = month
 *   GROUP BY created_at::date
 *   ORDER BY created_at::date;
 * END;
 * $$;
 */
async function getPostCountsByMonth(year, month) {
  const { data, error } = await supabase
    .rpc('get_post_counts_by_month', { year, month });
  if (error) throw error;
  return data; // 格式 [{ date: '2025-02-06', count: 23 }]
}

/**
 * 获取指定用户的帖子列表
 * @param {string} userId - 用户 UUID
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
async function getUserPosts(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url),
      school:schools(id, name, logo_url)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'normal')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  // 注意：用户查看自己的帖子时，即使匿名也不应隐藏作者？这里根据需求，如果匿名则仍应隐藏。
  const list = processPosts(data);
  return { list, total: count };
}

/**
 * 根据标签获取帖子列表
 * @param {string} tag - 标签名
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
async function getPostsByTag(tag, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url),
      school:schools(id, name, logo_url)
    `, { count: 'exact' })
    .contains('tags', [tag]) // tags 是 text[] 类型
    .eq('status', 'normal')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const list = processPosts(data);
  return { list, total: count };
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsByDate,
  getPostsByTag,
  getUserPosts,
  getPostCountsByMonth,
};