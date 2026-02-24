const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const postService = require('../services/postService');
const commentService = require('../services/commentService');
const collectionService = require('../services/collectionService');
const notificationService = require('../services/notificationService'); // 新增通知服务
const authenticateToken = require('../middleware/authMiddleware');
const supabase = require('../utils/supabase');

// ---------- 公共路由（无需认证）----------
// 获取帖子列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, schoolFilter = 'all', customSchoolIds } = req.query;
    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      schoolFilter,
      customSchoolIds: customSchoolIds ? customSchoolIds.split(',').map(Number) : [],
    };
    const result = await postService.getPosts(options);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('获取帖子列表失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 根据标签获取帖子列表
router.get('/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await postService.getPostsByTag(tag, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取某天的帖子
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await postService.getPostsByDate(date, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取某月的帖子统计（日历）
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const data = await postService.getPostCountsByMonth(parseInt(year), parseInt(month));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取帖子详情
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await postService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: '帖子不存在' });
    }
    // 增加浏览量
    await postService.updatePost(postId, { views_count: (post.views_count || 0) + 1 });
    res.json({ success: true, data: post });
  } catch (err) {
    console.error('获取帖子详情失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取帖子评论列表
router.get('/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await commentService.getCommentsByPost(postId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- 需认证路由 ----------
// 发布帖子
const postValidation = [
  body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 200 }),
  body('content').notEmpty().withMessage('内容不能为空'),
  body('schoolId').optional({ nullable: true }).isInt(),
  body('isAnonymous').optional().isBoolean(),
  body('visibility').optional().isIn(['public', 'school', 'followers']),
  body('tags').optional().isArray(),
  body('images').optional().isArray(),
  body('files').optional().isArray(),
  body('videos').optional().isArray(),
];
router.post('/', authenticateToken, postValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { title, content, schoolId, isAnonymous, visibility, tags, images, files, videos } = req.body;
  const userId = req.user.id;
  try {
    const postData = {
      user_id: userId,
      school_id: schoolId || null,
      title,
      content,
      is_anonymous: isAnonymous || false,
      visibility: visibility || 'public',
      tags: tags || [],
      images: images || [],
      files: files || [],
      videos: videos || [],
      status: 'normal',
    };
    const newPost = await postService.createPost(postData);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error('发布帖子失败:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 点赞/取消点赞帖子
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'post')
      .eq('target_id', postId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      await supabase.rpc('decrement_post_likes', { post_id: postId });
      res.json({ success: true, liked: false });
    } else {
      await supabase.from('likes').insert([{ user_id: userId, target_type: 'post', target_id: postId }]);
      await supabase.rpc('increment_post_likes', { post_id: postId });

      // 创建通知（如果不是自己的帖子）
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post.user_id !== userId) {
        await notificationService.createNotification({
          user_id: post.user_id,
          type: 'like',
          sender_id: userId,
          target_id: postId,
          target_type: 'post',
          content: `${req.user.username} 赞了你的帖子`
        });
      }

      res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error('点赞操作失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 收藏/取消收藏帖子
router.post('/:id/collect', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const collected = await collectionService.collectPost(userId, postId);

    // 如果是收藏（不是取消收藏）且不是自己的帖子，则创建通知
    if (collected) {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post.user_id !== userId) {
        await notificationService.createNotification({
          user_id: post.user_id,
          type: 'collection',
          sender_id: userId,
          target_id: postId,
          target_type: 'post',
          content: `${req.user.username} 收藏了你的帖子`
        });
      }
    }

    res.json({ success: true, collected });
  } catch (err) {
    console.error('收藏操作失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 发表评论
router.post('/:id/comments', authenticateToken, body('content').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { content, parentId } = req.body;
    const commentData = {
      user_id: userId,
      post_id: postId,
      content,
      parent_id: parentId || null,
      status: 'normal',
    };
    const newComment = await commentService.createComment(commentData);

    // 创建通知（如果不是自己的帖子）
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post.user_id !== userId) {
      await notificationService.createNotification({
        user_id: post.user_id,
        type: 'comment',
        sender_id: userId,
        target_id: postId,
        target_type: 'post',
        content: `${req.user.username} 评论了你的帖子：${content.slice(0, 20)}${content.length > 20 ? '...' : ''}`
      });
    }

    res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    console.error('发表评论失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除评论
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.id;
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();
    if (!comment) return res.status(404).json({ success: false, error: '评论不存在' });
    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '无权限' });
    }
    await commentService.deleteComment(commentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 点赞/取消点赞评论
router.post('/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.id;
    const liked = await commentService.likeComment(userId, commentId);

    // 如果需要评论点赞通知，可在此添加（本例暂略）

    res.json({ success: true, liked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;