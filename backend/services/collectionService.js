const supabase = require('../utils/supabase');

/**
 * 收藏/取消收藏帖子
 * @param {string} userId - 用户ID
 * @param {number} postId - 帖子ID
 * @returns {Promise<boolean>} - true 表示已收藏，false 表示已取消收藏
 */
async function collectPost(userId, postId) {
  // 检查是否已收藏
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    // 取消收藏
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;

    // 帖子收藏数减1
    await supabase.rpc('decrement_post_collections', { post_id: postId });
    return false;
  } else {
    // 添加收藏
    const { error } = await supabase
      .from('collections')
      .insert([{ user_id: userId, post_id: postId }]);
    if (error) throw error;

    // 帖子收藏数加1
    await supabase.rpc('increment_post_collections', { post_id: postId });
    return true;
  }
}

module.exports = {
  collectPost,
};