const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware'); // 新增
const suggestionService = require('../services/suggestionService');

// ---------- 用户接口 ----------
// 提交建议（需登录）
router.post('/', authenticateToken,
  body('title').notEmpty().isLength({ max: 200 }),
  body('content').notEmpty().isLength({ max: 5000 }),
  body('type').optional(),
  body('attachments').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const data = {
        user_id: req.user.id,
        title: req.body.title,
        content: req.body.content,
        type: req.body.type,
        attachments: req.body.attachments || [],
        status: 'pending',
      };
      const suggestion = await suggestionService.createSuggestion(data);
      res.status(201).json({ success: true, data: suggestion });
    } catch (err) {
      console.error('提交建议失败:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 获取当前用户的建议列表
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await suggestionService.getUserSuggestions(req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取单个建议详情（需登录且只能看自己的）
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const suggestion = await suggestionService.getSuggestionById(id);
    if (!suggestion) {
      return res.status(404).json({ success: false, error: '建议不存在' });
    }
    // 普通用户只能看自己的，管理员可以看所有
    if (req.user.role !== 'super_admin' && suggestion.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: '无权查看' });
    }
    res.json({ success: true, data: suggestion });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- 管理员接口（仅超级管理员）----------
// 获取所有建议（支持状态筛选）
router.get('/admin/all', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const { status } = req.query;
    const result = await suggestionService.getAllSuggestions({ page, pageSize, status });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 管理员回复建议
router.put('/admin/:id/reply', authenticateToken, requireSuperAdmin,
  body('reply').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const id = parseInt(req.params.id);
      const suggestion = await suggestionService.replySuggestion(id, req.body.reply);
      res.json({ success: true, data: suggestion });
    } catch (err) {
      console.error('回复失败:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 管理员关闭建议
router.put('/admin/:id/close', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const suggestion = await suggestionService.closeSuggestion(id);
    res.json({ success: true, data: suggestion });
  } catch (err) {
    console.error('关闭失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;