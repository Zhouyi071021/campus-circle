const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');
const announcementService = require('../services/announcementService');

// ---------- 公开接口 ----------
// 获取公告列表（只显示启用的）
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await announcementService.getAnnouncements({ page, pageSize, isActive: true });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取单条公告（公开）
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const announcement = await announcementService.getAnnouncementById(id);
    if (!announcement) return res.status(404).json({ success: false, error: '公告不存在' });
    // 确保只返回启用的
    if (!announcement.is_active) return res.status(404).json({ success: false, error: '公告不存在' });
    res.json({ success: true, data: announcement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- 管理员接口（仅超级管理员）----------
// 获取所有公告（包括未启用的）
router.get('/admin/all', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const { isActive } = req.query; // 可选筛选
    const result = await announcementService.getAnnouncements({ page, pageSize, isActive: isActive === undefined ? undefined : isActive === 'true' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 创建公告
router.post('/', authenticateToken, requireSuperAdmin,
  body('title').notEmpty().isLength({ max: 200 }),
  body('content').notEmpty(),
  body('attachments').optional().isArray(),
  body('is_active').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const announcement = await announcementService.createAnnouncement({
        title: req.body.title,
        content: req.body.content,
        attachments: req.body.attachments || [],
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      });
      res.status(201).json({ success: true, data: announcement });
    } catch (err) {
      console.error('创建公告失败:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 更新公告
router.put('/:id', authenticateToken, requireSuperAdmin,
  body('title').optional().isLength({ max: 200 }),
  body('content').optional(),
  body('attachments').optional().isArray(),
  body('is_active').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const id = parseInt(req.params.id);
      const announcement = await announcementService.updateAnnouncement(id, req.body);
      res.json({ success: true, data: announcement });
    } catch (err) {
      console.error('更新公告失败:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 删除公告
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await announcementService.deleteAnnouncement(id);
    res.json({ success: true });
  } catch (err) {
    console.error('删除公告失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;