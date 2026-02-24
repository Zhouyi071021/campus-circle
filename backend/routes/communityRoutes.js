const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const communityService = require('../services/communityService');
const supabase = require('../utils/supabase'); // 删除帖子时可能需要

// 获取社区列表（公开）
router.get('/', async (req, res) => {
  try {
    const { page, pageSize, category, search } = req.query;
    const result = await communityService.getCommunities({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      category,
      search,
      status: 'approved',
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('获取社区列表失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取单个社区详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const community = await communityService.getCommunityById(id);
    if (!community) {
      return res.status(404).json({ success: false, error: '社区不存在' });
    }
    res.json({ success: true, data: community });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 创建社区（需要登录）
const communityValidation = [
  body('name').notEmpty().isLength({ max: 100 }),
  body('description').optional(),
  body('category').optional(),
  body('rules').optional(),
  body('cover_url').optional().isURL(),
];
router.post('/', authenticateToken, communityValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { name, description, category, rules, cover_url } = req.body;
  const userId = req.user.id;
  try {
    const communityData = {
      name,
      description,
      category,
      rules,
      cover_url: cover_url || 'default_community_cover.png',
      creator_id: userId,
      status: 'pending',
    };
    const newCommunity = await communityService.createCommunity(communityData);
    res.status(201).json({ success: true, data: newCommunity });
  } catch (err) {
    console.error('创建社区失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 加入社区
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = req.user.id;
    await communityService.joinCommunity(communityId, userId);
    res.json({ success: true, message: '加入成功' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 退出社区
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = req.user.id;
    await communityService.leaveCommunity(communityId, userId);
    res.json({ success: true, message: '退出成功' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 检查是否已加入
router.get('/:id/is-member', authenticateToken, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = req.user.id;
    const member = await communityService.isMember(communityId, userId);
    res.json({ success: true, isMember: member });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取社区成员列表
router.get('/:id/members', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await communityService.getCommunityMembers(id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取社区帖子列表
router.get('/:id/posts', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await communityService.getCommunityPosts(id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 在社区内发帖（需登录且是社区成员）
router.post('/:id/posts', authenticateToken, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = req.user.id;
    const isMember = await communityService.isMember(communityId, userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: '只有社区成员才能发帖' });
    }
    const { title, content, images, files } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和内容不能为空' });
    }
    const postData = {
      community_id: communityId,
      user_id: userId,
      title,
      content,
      images: images || [],
      files: files || [],
    };
    const newPost = await communityService.createCommunityPost(postData);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error('发布社区帖子失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除社区帖子（作者或社区创建者）
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;
    const { data: post, error: postErr } = await supabase
      .from('community_posts')
      .select('community_id, user_id')
      .eq('id', postId)
      .single();
    if (postErr || !post) return res.status(404).json({ success: false, error: '帖子不存在' });
    const community = await communityService.getCommunityById(post.community_id);
    if (post.user_id !== userId && community.creator_id !== userId) {
      return res.status(403).json({ success: false, error: '无权删除' });
    }
    await supabase.from('community_posts').delete().eq('id', postId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除社区（仅创建者）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const userId = req.user.id;
    const community = await communityService.getCommunityById(communityId);
    if (!community) return res.status(404).json({ success: false, error: '社区不存在' });
    if (community.creator_id !== userId) {
      return res.status(403).json({ success: false, error: '只有创建者才能删除社区' });
    }
    const { error } = await supabase.from('communities').delete().eq('id', communityId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;