const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { requireAdmin, requireSuperAdmin, requireAnyAdmin } = require('../middleware/roleMiddleware');
const supabase = require('../utils/supabase');
const notificationService = require('../services/notificationService');

// 所有管理员路由都需要先认证
router.use(authenticateToken);

// ================= 仪表盘（所有管理员可见）=================
router.get('/dashboard/stats', requireAnyAdmin, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [newUsers, newPosts, pendingCommunities, pendingBusiness] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('communities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    
    res.json({
      success: true,
      data: {
        newUsers: newUsers.count,
        newPosts: newPosts.count,
        pendingCommunities: pendingCommunities.count,
        pendingBusiness: pendingBusiness.count,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 趋势数据（超级管理员可用）
router.get('/dashboard/trends', requireSuperAdmin, async (req, res) => {
  try {
    const today = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      dates.push(d.toISOString());
    }
    const nextDays = dates.map(d => new Date(new Date(d).getTime() + 24*60*60*1000).toISOString());

    const usersPromise = supabase
      .from('users')
      .select('created_at', { count: 'exact' })
      .gte('created_at', dates[0])
      .lt('created_at', nextDays[6]);
    const postsPromise = supabase
      .from('posts')
      .select('created_at', { count: 'exact' })
      .gte('created_at', dates[0])
      .lt('created_at', nextDays[6]);

    const [usersRes, postsRes] = await Promise.all([usersPromise, postsPromise]);
    
    res.json({
      success: true,
      data: {
        users7d: usersRes.count || 0,
        posts7d: postsRes.count || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= 普通管理员权限 =================
// 帖子管理
router.get('/posts/manage', requireAdmin, async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:users(id, username)', { count: 'exact' })
    .eq('status', 'normal')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  res.json({ success: true, list: data, total: count });
});

// 删除帖子
router.put('/posts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reject_reason } = req.body;
  
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id, title')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  if (status === 'rejected') {
    await supabase
      .from('comments')
      .update({ status: 'rejected', updated_at: new Date() })
      .eq('post_id', id);
  }

  const { data, error } = await supabase
    .from('posts')
    .update({ status, reject_reason, updated_at: new Date() })
    .eq('id', id)
    .select();
  if (error) throw error;

  if (status === 'rejected') {
    await notificationService.createNotification({
      user_id: post.user_id,
      type: 'post_rejected',
      target_id: id,
      target_type: 'post',
      content: `您的帖子《${post.title}》已被管理员删除，原因：${reject_reason || '未提供原因'}`,
    });
  }

  res.json({ success: true, data });
});

// 评论管理
router.get('/comments/manage', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        user:users!user_id(id, username, avatar_url),
        post:posts!post_id(id, title)
      `, { count: 'exact' })
      .eq('status', 'normal')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) {
      console.error('评论管理查询错误:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, list: data, total: count });
  } catch (err) {
    console.error('评论管理异常:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除评论
router.put('/comments/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('comments')
      .update({ status, reject_reason, updated_at: new Date() })
      .eq('id', id)
      .select();
    if (error) throw error;

    if (status === 'rejected') {
      const { data: post } = await supabase
        .from('posts')
        .select('title')
        .eq('id', comment.post_id)
        .single();
      await notificationService.createNotification({
        user_id: comment.user_id,
        type: 'comment_rejected',
        target_id: id,
        target_type: 'comment',
        content: `您在帖子《${post?.title || '未知'}》中的评论被管理员删除，原因：${reject_reason || '未提供原因'}`,
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('删除评论错误:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 用户管理
router.get('/users', requireAdmin, async (req, res) => {
  const { page = 1, pageSize = 20, search } = req.query;
  let query = supabase.from('users').select('*', { count: 'exact' });
  if (search) query = query.ilike('username', `%${search}%`);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ success: true, list: data, total: count });
});

router.put('/users/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active, ban_reason } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ is_active, ban_reason, updated_at: new Date() })
    .eq('id', id)
    .select();
  if (error) throw error;
  res.json({ success: true, data });
});

// 商家审核
router.get('/businesses/pending', requireAdmin, async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('businesses')
    .select('*, user:users(id, username)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  res.json({ success: true, list: data, total: count });
});

router.put('/businesses/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reject_reason } = req.body;
  
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('user_id, title')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('businesses')
    .update({ status, reject_reason, updated_at: new Date() })
    .eq('id', id)
    .select();
  if (error) throw error;

  if (status === 'rejected') {
    await notificationService.createNotification({
      user_id: business.user_id,
      type: 'business_rejected',
      target_id: id,
      target_type: 'business',
      content: `您的商家服务《${business.title}》被拒绝，原因：${reject_reason || '未提供原因'}`,
    });
  }

  res.json({ success: true, data });
});
// 获取所有商家服务（支持按状态筛选）
router.get('/businesses', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('businesses')
      .select('*, user:users(id, username)', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    res.json({ success: true, list: data, total: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 社区审核
router.get('/communities/pending', requireAdmin, async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('communities')
    .select('*, creator:users(id, username)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  res.json({ success: true, list: data, total: count });
});

router.put('/communities/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reject_reason } = req.body;
  
  const { data: community, error: fetchError } = await supabase
    .from('communities')
    .select('creator_id, name')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('communities')
    .update({ status, reject_reason, updated_at: new Date() })
    .eq('id', id)
    .select();
  if (error) throw error;

  if (status === 'rejected') {
    await notificationService.createNotification({
      user_id: community.creator_id,
      type: 'community_rejected',
      target_id: id,
      target_type: 'community',
      content: `您创建的社区《${community.name}》被拒绝，原因：${reject_reason || '未提供原因'}`,
    });
  }

  res.json({ success: true, data });
});
// 获取所有商家申请（支持按状态筛选）
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('business_applications')
      .select('*, user:users(id, username, avatar_url)', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    res.json({ success: true, list: data, total: count });
  } catch (err) {
    console.error('获取商家申请失败', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// 删除商家申请
router.delete('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('business_applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('删除申请失败', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// 获取所有社区（支持按状态筛选）
router.get('/communities', requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('communities')
      .select('*, creator:users(id, username)', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    res.json({ success: true, list: data, total: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 学校管理
router.get('/schools', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('schools').select('*').order('name');
  if (error) throw error;
  res.json({ success: true, data });
});

router.post('/schools', requireAdmin, async (req, res) => {
  const { name, district_id, logo_url } = req.body;
  const { data, error } = await supabase.from('schools').insert([{ name, district_id, logo_url }]).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.put('/schools/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase.from('schools').update(updates).eq('id', id).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.delete('/schools/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('schools').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true });
});

// 地区管理
router.get('/districts', requireAdmin, async (req, res) => {
  const { level, parent_id } = req.query;
  let query = supabase.from('districts').select('*');
  if (level) query = query.eq('level', level);
  if (parent_id) query = query.eq('parent_id', parent_id);
  const { data, error } = await query.order('id');
  if (error) throw error;
  res.json({ success: true, data });
});

router.post('/districts', requireAdmin, async (req, res) => {
  const { name, parent_id, level } = req.body;
  if (!name || !level) return res.status(400).json({ success: false, error: '缺少必要参数' });
  const { data, error } = await supabase
    .from('districts')
    .insert([{ name, parent_id: parent_id || null, level }])
    .select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.put('/districts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from('districts')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.delete('/districts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('districts')
    .delete()
    .eq('id', id);
  if (error) throw error;
  res.json({ success: true });
});

// 广告管理
router.get('/ads', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('ads').select('*').order('sort_order');
  if (error) throw error;
  res.json({ success: true, data });
});

router.post('/ads', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('ads').insert([req.body]).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.put('/ads/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('ads').update(req.body).eq('id', id).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.delete('/ads/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true });
});

// 背景音乐管理
router.get('/music', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('music').select('*').order('sort_order');
  if (error) throw error;
  res.json({ success: true, data });
});

router.post('/music', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('music').insert([req.body]).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.put('/music/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('music').update(req.body).eq('id', id).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.delete('/music/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('music').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true });
});

// 协议管理
router.get('/agreements', requireAdmin, async (req, res) => {
  const { type } = req.query;
  let query = supabase.from('agreements').select('*').order('created_at', { ascending: false });
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  res.json({ success: true, data });
});

router.post('/agreements', requireAdmin, async (req, res) => {
  const { type, content, version } = req.body;
  if (req.body.is_current) {
    await supabase.from('agreements').update({ is_current: false }).eq('type', type);
  }
  const { data, error } = await supabase
    .from('agreements')
    .insert([{ type, content, version, is_current: req.body.is_current || false }])
    .select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.put('/agreements/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { type, is_current } = req.body;
  if (is_current) {
    await supabase.from('agreements').update({ is_current: false }).eq('type', type);
  }
  const { data, error } = await supabase.from('agreements').update(req.body).eq('id', id).select();
  if (error) throw error;
  res.json({ success: true, data });
});

router.delete('/agreements/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('agreements').delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true });
});

// ================= 超级管理员权限 =================
// 操作日志
router.get('/logs', requireSuperAdmin, async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('admin_logs')
    .select('*, admin:users(id, username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  res.json({ success: true, list: data, total: count });
});

// 管理员管理
router.get('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, role, created_at')
      .in('role', ['admin', 'super_admin']);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body; // role 可以是 'admin' 或 'super_admin'（仅超级管理员可设为 super_admin）
    if (!userId || !role) return res.status(400).json({ success: false, error: '缺少用户ID或角色' });
    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ success: false, error: '无效的角色' });
    }
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/admins/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'user' })
      .eq('id', userId)
      .in('role', ['admin', 'super_admin'])
      .select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;