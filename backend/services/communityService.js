const supabase = require('../utils/supabase');

// 获取社区列表（支持分页、分类、搜索）
async function getCommunities(options) {
  const { page = 1, pageSize = 20, category, search, status = 'approved' } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('communities')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('member_count', { ascending: false }); // 默认按成员数排序

  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 获取单个社区详情（包含创建者信息、成员数等）
async function getCommunityById(id) {
  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      creator:users(id, username, avatar_url)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// 创建社区（待审核）
async function createCommunity(communityData) {
  const { data, error } = await supabase
    .from('communities')
    .insert([communityData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 更新社区
async function updateCommunity(id, updates) {
  const { data, error } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 加入社区
async function joinCommunity(communityId, userId) {
  // 检查是否已是成员
  const { data: existing } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    throw new Error('已经是社区成员');
  }

  // 添加成员记录
  const { error: insertError } = await supabase
    .from('community_members')
    .insert([{ community_id: communityId, user_id: userId, role: 'member' }]);
  if (insertError) throw insertError;

  // 社区成员数+1
  await supabase.rpc('increment_community_member_count', { community_id: communityId });
  return true;
}

// 退出社区
async function leaveCommunity(communityId, userId) {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) throw error;

  // 社区成员数-1
  await supabase.rpc('decrement_community_member_count', { community_id: communityId });
  return true;
}

// 检查用户是否已加入社区
async function isMember(communityId, userId) {
  const { data, error } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// 获取社区成员列表
async function getCommunityMembers(communityId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('community_members')
    .select(`
      user:users(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('community_id', communityId)
    .range(from, to);
  if (error) throw error;
  return { list: data.map(item => item.user), total: count };
}
// 获取社区帖子列表（分页）
async function getCommunityPosts(communityId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('community_posts')
    .select(`
      *,
      user:users(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 创建社区帖子
async function createCommunityPost(postData) {
  const { data, error } = await supabase
    .from('community_posts')
    .insert([postData])
    .select(`
      *,
      user:users(id, username, avatar_url)
    `)
    .single();
  if (error) throw error;
  // 社区帖子数+1
  await supabase.rpc('increment_community_post_count', { community_id: postData.community_id });
  return data;
}

// 删除社区帖子
async function deleteCommunityPost(postId, userId) {
  const { data, error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId) // 仅作者可删（或社区创建者也可）
    .select();
  if (error) throw error;
  if (data.length === 0) throw new Error('无权限删除');
  return data[0];
}
module.exports = {
  getCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  joinCommunity,
  leaveCommunity,
  isMember,
};