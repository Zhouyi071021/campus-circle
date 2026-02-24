const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

// 获取当前用户的通知列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await notificationService.getUserNotifications(req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('获取通知失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取未读通知数量
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (err) {
    console.error('获取未读数失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 标记单条通知为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('标记已读失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 标记所有通知为已读
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('标记全部已读失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;