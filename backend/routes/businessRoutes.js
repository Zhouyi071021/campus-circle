const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const businessService = require('../services/businessService');

// 获取服务列表（公开）
router.get('/', async (req, res) => {
  try {
    const { page, pageSize, category, sort, order } = req.query;
    const result = await businessService.getBusinesses({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      category,
      sort,
      order,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('获取服务列表失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取单个服务详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const business = await businessService.getBusinessById(id);
    if (!business) {
      return res.status(404).json({ success: false, error: '服务不存在' });
    }
    // 增加浏览量
    await businessService.updateBusiness(id, { view_count: (business.view_count || 0) + 1 });
    res.json({ success: true, data: business });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 发布服务（需要商家权限）
const businessValidation = [
  body('title').notEmpty().isLength({ max: 200 }),
  body('description').notEmpty(),
  body('category').optional(),
  body('price_range').optional(),
  body('location').optional(),
  body('contact_phone').optional(),
  body('contact_wechat').optional(),
  body('contact_qq').optional(),
  body('business_hours').optional(),
  body('images').optional().isArray(),
  body('attachments').optional().isArray(),
];
router.post('/', authenticateToken, businessValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const userId = req.user.id;

  try {
    // 检查用户角色是否为商家（此处可扩展，如果普通用户想发布，可以提示申请成为商家）
    // 简单起见，我们假设所有用户都能发，但管理员审核时需检查。也可以加中间件检查 role === 'business'
    // 这里不强制，后面可以在前端限制只有商家账号可见发布入口

    // 检查每日限制（仅对商家账号生效，普通用户可能无限制，但按设计商家每天限1篇）
    const todayCount = await businessService.getUserTodayCount(userId);
    if (todayCount >= 1) {
      return res.status(429).json({ success: false, error: '今日发布已达上限' });
    }

    const businessData = {
      ...req.body,
      user_id: userId,
      status: 'pending', // 待审核
    };
    const newBusiness = await businessService.createBusiness(businessData);
    res.status(201).json({ success: true, data: newBusiness });
  } catch (err) {
    console.error('发布服务失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取用户今日发布剩余次数（用于前端显示）
router.get('/remaining-today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await businessService.getUserTodayCount(userId);
    res.json({ success: true, remaining: Math.max(0, 1 - count) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;