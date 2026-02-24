const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const commentService = require('../services/commentService');

// 获取帖子的评论列表（公开）
router.get('/post/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await commentService.getCommentsByPost(postId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('获取评论列表失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 发表评论（需登录）
router.post('/',
  authenticateToken,
  body('postId').isInt(),
  body('content').notEmpty(),
  body('parentId').optional().isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { postId, content, parentId } = req.body;
      const userId = req.user.id;
      const commentData = {
        user_id: userId,
        post_id: postId,
        content,
        parent_id: parentId || null,
        status: 'normal', // 待审核
      };
      const newComment = await commentService.createComment(commentData);
      res.status(201).json({ success: true, data: newComment });
    } catch (err) {
      console.error('发表评论失败', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 获取单条评论详情（公开）
router.get('/:id', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const comment = await commentService.getCommentById(commentId);
    if (!comment) return res.status(404).json({ success: false, error: '评论不存在' });
    res.json({ success: true, data: comment });
  } catch (err) {
    console.error('获取评论详情失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除评论（需登录且是作者或管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;
    const comment = await commentService.getCommentById(commentId);
    if (!comment) return res.status(404).json({ success: false, error: '评论不存在' });
    if (comment.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: '无权删除此评论' });
    }
    await commentService.deleteComment(commentId);
    res.json({ success: true });
  } catch (err) {
    console.error('删除评论失败', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 点赞/取消点赞评论
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;
    const liked = await commentService.likeComment(userId, commentId);
    res.json({ success: true, liked });
  } catch (err) {
    console.error('点赞评论失败', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;