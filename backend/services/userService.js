const supabase = require('../utils/supabase');

// ---------- 基础用户操作 ----------

/**
 * 根据用户名查找用户（用于登录）
 */
/**
 * 根据用户名查找用户（用于登录）
 */
async function findUserByUsername(username) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      school:schools(id, name, logo_url)
    `)
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * 根据 ID 获取用户完整信息（包含学校关联）
 */
async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      school:schools(id, name, logo_url)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * 创建新用户
 */
async function createUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * 更新用户信息
 */
async function updateUser(id, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * 检查用户名是否存在
 */
async function checkUsernameExists(username) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ---------- 用户公开信息 ----------

/**
 * 获取用户公开信息（用于他人主页）
 */
async function getUserPublicInfo(id) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      avatar_url,
      bio,
      followers_count,
      following_count,
      posts_count,
      title,
      qq,
      wechat,
      school:schools(id, name)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ---------- 用户设置 ----------

/**
 * 获取用户设置
 */
async function getUserSettings(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('settings')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data.settings || {};
}

/**
 * 更新用户设置
 */
async function updateUserSettings(userId, settings) {
  const { data, error } = await supabase
    .from('users')
    .update({ settings })
    .eq('id', userId)
    .select('settings')
    .single();
  if (error) throw error;
  return data.settings;
}

/**
 * 修改密码
 */
async function changePassword(userId, newPasswordHash) {
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newPasswordHash, updated_at: new Date() })
    .eq('id', userId);
  if (error) throw error;
  return true;
}

/**
 * 注销账号（软删除）
 */
async function deactivateAccount(userId) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', userId);
  if (error) throw error;
  return true;
}

// ---------- 关注/粉丝 ----------

/**
 * 关注用户
 */
async function follow(followerId, followingId) {
  // 检查是否已关注
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (existing) {
    throw new Error('已经关注过了');
  }
  // 插入关注关系
  const { error: insertError } = await supabase
    .from('follows')
    .insert([{ follower_id: followerId, following_id: followingId }]);
  if (insertError) throw insertError;

  // 更新双方的关注/粉丝数（需要RPC函数）
  await supabase.rpc('increment_follow_counts', { follower: followerId, following: followingId });
  return true;
}

/**
 * 取消关注
 */
async function unfollow(followerId, followingId) {
  const { error: deleteError } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (deleteError) throw deleteError;

  await supabase.rpc('decrement_follow_counts', { follower: followerId, following: followingId });
  return true;
}

/**
 * 获取用户的粉丝列表（公开）
 */
async function getFollowers(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('follows')
    .select(`
      follower:users!follows_follower_id_fkey(id, username, avatar_url, followers_count)
    `, { count: 'exact' })
    .eq('following_id', userId)
    .range(from, to);
  if (error) throw error;
  return { list: data.map(item => item.follower), total: count };
}

/**
 * 获取用户的关注列表（公开）
 */
async function getFollowing(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('follows')
    .select(`
      following:users!follows_following_id_fkey(id, username, avatar_url, followers_count)
    `, { count: 'exact' })
    .eq('follower_id', userId)
    .range(from, to);
  if (error) throw error;
  return { list: data.map(item => item.following), total: count };
}

/**
 * 获取当前用户的关注列表（带是否互关状态）
 */
async function getFollowingWithStatus(currentUserId, targetUserId, page = 1, pageSize = 20) {
  const { list } = await getFollowing(targetUserId, page, pageSize);
  const enriched = await Promise.all(list.map(async (user) => {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentUserId)
      .eq('following_id', user.id);
    return { ...user, isFollowing: count > 0 };
  }));
  return { list: enriched };
}

/**
 * 获取当前用户的粉丝列表（带是否互关状态）
 */
async function getFollowersWithStatus(currentUserId, targetUserId, page = 1, pageSize = 20) {
  const { list } = await getFollowers(targetUserId, page, pageSize);
  const enriched = await Promise.all(list.map(async (user) => {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentUserId)
      .eq('following_id', user.id);
    return { ...user, isFollowing: count > 0 };
  }));
  return { list: enriched };
}

// ---------- 用户内容 ----------

/**
 * 获取用户帖子列表
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
  return { list: data, total: count };
}

/**
 * 获取用户评论列表
 */
async function getUserComments(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('comments')
    .select(`
      *,
      post:posts(id, title),
      user:users(id, username, avatar_url)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'normal')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

/**
 * 获取用户收藏列表
 */
async function getUserCollections(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('collections')
    .select(`
      post:posts(
        *,
        user:users(id, username, avatar_url),
        school:schools(id, name)
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { list: data.map(item => item.post), total: count };
}

// ---------- 收藏帖子（用于其他服务） ----------

/**
 * 收藏/取消收藏帖子
 */
async function collectPost(userId, postId) {
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    await supabase.rpc('decrement_post_collections', { post_id: postId });
    return false;
  } else {
    const { error } = await supabase
      .from('collections')
      .insert([{ user_id: userId, post_id: postId }]);
    if (error) throw error;
    await supabase.rpc('increment_post_collections', { post_id: postId });
    return true;
  }
}

// ---------- 头衔计算 ----------

/**
 * 根据粉丝数获取头衔
 */
function getTitleByFollowers(count) {
  if (count >= 5000) return '校园传奇';
  if (count >= 1000) return '论坛元老';
  if (count >= 500) return '校园网红';
  if (count >= 100) return '社区达人';
  if (count >= 50) return '校园新星';
  return '校园新星';
}

module.exports = {
  // 基础
  findUserByUsername,
  getUserById,
  createUser,
  updateUser,
  checkUsernameExists,
  getUserPublicInfo,
  // 设置
  getUserSettings,
  updateUserSettings,
  changePassword,
  deactivateAccount,
  // 关注
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getFollowingWithStatus,
  getFollowersWithStatus,
  // 内容
  getUserPosts,
  getUserComments,
  getUserCollections,
  collectPost,
  // 工具
  getTitleByFollowers,
};