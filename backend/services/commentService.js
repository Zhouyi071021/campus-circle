const supabase = require('../utils/supabase');

async function getCommentsByPost(postId, page = 1, pageSize = 20) {
  console.log(`[getCommentsByPost] 查询评论: postId=${postId}, page=${page}, pageSize=${pageSize}`);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  console.log(`[getCommentsByPost] 分页范围: from=${from}, to=${to}`);
  try {
    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        user:users!user_id(id, username, avatar_url)   // ✅ 确保这里也使用了显式关联
      `, { count: 'exact' })
      .eq('post_id', postId)
      .eq('status', 'normal')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[getCommentsByPost] Supabase错误:', error);
      throw error;
    }
    console.log(`[getCommentsByPost] 查询成功，数据条数:`, data?.length);
    return { list: data, total: count };
  } catch (err) {
    console.error('[getCommentsByPost] 异常:', err);
    throw err;
  }
}
async function createComment(commentData) {
  const { data, error } = await supabase
    .from('comments')
    .insert([commentData])
    .select(`
      *,
      user:users!user_id(id, username, avatar_url)   // ✅ 明确指定使用 user_id 外键
    `)
    .single();
  if (error) throw error;
  // 更新帖子的评论数
  await supabase.rpc('increment_post_comments', { post_id: commentData.post_id });
  return data;
}

// 删除评论（软删除）
async function deleteComment(id) {
  const { error } = await supabase
    .from('comments')
    .update({ status: 'deleted' })
    .eq('id', id);
  if (error) throw error;
  return true;
}

// 点赞/取消点赞评论
async function likeComment(userId, commentId) {
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', 'comment')
    .eq('target_id', commentId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    await supabase.rpc('decrement_comment_likes', { comment_id: commentId });
    return false;
  } else {
    const { error } = await supabase
      .from('likes')
      .insert([{ user_id: userId, target_type: 'comment', target_id: commentId }]);
    if (error) throw error;
    await supabase.rpc('increment_comment_likes', { comment_id: commentId });
    return true;
  }
}

// 获取用户发表的评论列表（公开或用户自己的，只显示正常评论）
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
    .eq('status', 'normal')   // 修正为只显示正常评论（原代码为 'rejected' 错误）
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
  likeComment,
  getUserComments,
};