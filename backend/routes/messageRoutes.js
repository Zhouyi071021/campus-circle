const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const messageService = require('../services/messageService');

// 获取会话列表
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const convos = await messageService.getConversations(userId);
    res.json({ success: true, data: convos });
  } catch (err) {
    console.error('获取会话列表失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取某个会话的消息
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await messageService.getMessages(conversationId, userId, page, pageSize);
    // 标记该会话为已读
    await messageService.markAsRead(conversationId, userId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('获取消息失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 发送消息
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, type, metadata } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, error: '缺少 receiverId 或 content' });
    }
    const message = await messageService.sendMessage(senderId, receiverId, content, type, metadata);
    res.json({ success: true, data: message });
  } catch (err) {
    console.error('发送消息失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取总未读数（用于底部导航红点）
router.get('/unread-counts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const convos = await messageService.getConversations(userId);
    const totalUnread = convos.reduce((acc, c) => acc + c.unread_count, 0);
    res.json({ 
      success: true, 
      totalUnread, 
      conversations: convos.map(c => ({ id: c.conversation_id, unread: c.unread_count }))
    });
  } catch (err) {
    console.error('获取未读数失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;