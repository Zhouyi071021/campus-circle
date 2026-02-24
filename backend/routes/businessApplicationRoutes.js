const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleMiddleware');
const applicationService = require('../services/businessApplicationService');
const notificationService = require('../services/notificationService'); // 新增

// 提交申请（需登录）
router.post('/', authenticateToken,
  body('store_name').notEmpty().isLength({ max: 100 }).withMessage('店铺名称不能超过100字符'),
  body('contact_phone').notEmpty().isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('contact_wechat').optional({ nullable: true }).isLength({ max: 50 }),
  body('business_license').optional({ nullable: true }).isURL().withMessage('营业执照图片必须是有效URL'),
  body('reason').optional({ nullable: true }).isLength({ max: 500 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const existing = await applicationService.getUserApplication(req.user.id);
      if (existing) {
        return res.status(400).json({ success: false, error: '您已提交过申请，请等待审核' });
      }
      const application = await applicationService.createApplication({
        user_id: req.user.id,
        store_name: req.body.store_name,
        contact_phone: req.body.contact_phone,
        contact_wechat: req.body.contact_wechat || null,
        business_license: req.body.business_license || null,
        reason: req.body.reason || null,
      });
      res.status(201).json({ success: true, data: application });
    } catch (err) {
      console.error('提交申请失败', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 获取当前用户的申请状态
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const application = await applicationService.getUserApplication(req.user.id);
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 管理员获取待审核申请列表（仅超级管理员）
router.get('/pending', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await applicationService.getPendingApplications(page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 管理员审核（仅超级管理员）
router.put('/:id/review', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { status, reject_reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: '无效的状态' });
    }
    const result = await applicationService.reviewApplication(req.params.id, status, reject_reason);

    // 如果拒绝，发送通知
    if (status === 'rejected') {
      await notificationService.createNotification({
        user_id: result.user_id,
        type: 'business_application_rejected',
        target_id: result.id,
        target_type: 'business_application',
        content: `您的商家申请《${result.store_name}》被拒绝，原因：${reject_reason || '未提供原因'}`,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// 删除申请（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 可选：检查申请是否存在
    const { data: existing, error: checkError } = await supabase
      .from('business_applications')
      .select('id')
      .eq('id', id)
      .single();
    if (checkError || !existing) {
      return res.status(404).json({ success: false, error: '申请不存在' });
    }

    // 执行删除
    const { error } = await supabase
      .from('business_applications')
      .delete()
      .eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除申请失败', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;