const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');
const userService = require('../services/userService');
const auth = require('../utils/auth');
const supabase = require('../utils/supabase');

// 获取设置
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await userService.getUserSettings(req.user.id);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 更新设置
router.put('/', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    const updated = await userService.updateUserSettings(req.user.id, settings);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 修改密码
router.put('/password',
  authenticateToken,
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 8, max: 20 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      console.log('修改密码 - 用户ID:', req.user.id);
      const { oldPassword, newPassword } = req.body;
      const user = await userService.getUserById(req.user.id);
      console.log('查询到的用户:', user ? '存在' : '不存在');
      if (user) {
        console.log('密码哈希是否存在:', !!user.password_hash);
      }

      if (!user || !auth.comparePassword(oldPassword, user.password_hash)) {
        return res.status(401).json({ success: false, error: '原密码错误' });
      }
      const newHash = auth.hashPassword(newPassword);
      await userService.changePassword(req.user.id, newHash);
      res.json({ success: true, message: '密码修改成功' });
    } catch (err) {
      console.error('修改密码错误详情:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 注销账号
router.delete('/account',
  authenticateToken,
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { password } = req.body;
      // ✅ 使用正确的函数名 getUserById
      const user = await userService.getUserById(req.user.id);
      if (!user || !auth.comparePassword(password, user.password_hash)) {
        return res.status(401).json({ success: false, error: '密码错误' });
      }
      await userService.deactivateAccount(req.user.id);
      res.json({ success: true, message: '账号已注销' });
    } catch (err) {
      console.error('注销账号失败:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// 获取用户协议
// 获取协议内容（从数据库获取最新版本）
router.get('/agreement/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { data, error } = await supabase
      .from('agreements')
      .select('content')
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, data: data ? data.content : '协议内容未找到' });
  } catch (err) {
    console.error('获取协议失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 发送短信验证码
router.post('/send-sms', authenticateToken, body('phone').isMobilePhone(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone } = req.body;
  console.log(`发送验证码到手机 ${phone}`);
  res.json({ success: true, message: '验证码已发送' });
});

// 绑定手机号
router.post('/bind-phone', authenticateToken, body('phone').isMobilePhone(), body('captcha').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { phone, captcha } = req.body;
  if (captcha !== '123456') {
    return res.status(400).json({ success: false, error: '验证码错误' });
  }
  await supabase.from('users').update({ phone }).eq('id', req.user.id);
  res.json({ success: true });
});

// 发送邮箱验证码
router.post('/send-email-captcha', authenticateToken, body('email').isEmail(), async (req, res) => {
  const { email } = req.body;
  console.log(`发送验证码到邮箱 ${email}`);
  res.json({ success: true });
});

// 绑定邮箱
router.post('/bind-email', authenticateToken, body('email').isEmail(), body('captcha').notEmpty(), async (req, res) => {
  const { email, captcha } = req.body;
  if (captcha !== '123456') {
    return res.status(400).json({ success: false, error: '验证码错误' });
  }
  await supabase.from('users').update({ email }).eq('id', req.user.id);
  res.json({ success: true });
});

// 黑名单管理
router.get('/blacklist', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('blacklist')
    .select('blocked_user:users!blocked_id(id, username, avatar_url)')
    .eq('user_id', req.user.id);
  if (error) throw error;
  res.json({ success: true, data: data.map(b => b.blocked_user) });
});

router.delete('/blacklist/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { error } = await supabase
    .from('blacklist')
    .delete()
    .eq('user_id', req.user.id)
    .eq('blocked_id', userId);
  if (error) throw error;
  res.json({ success: true });
});

router.post('/blacklist/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  if (currentUserId === userId) {
    return res.status(400).json({ success: false, error: '不能拉黑自己' });
  }
  const { data: existing } = await supabase
    .from('blacklist')
    .select('id')
    .eq('user_id', currentUserId)
    .eq('blocked_id', userId)
    .maybeSingle();
  if (existing) {
    return res.status(400).json({ success: false, error: '已经拉黑了该用户' });
  }
  const { error } = await supabase
    .from('blacklist')
    .insert([{ user_id: currentUserId, blocked_id: userId }]);
  if (error) return res.status(500).json({ success: false, error: error.message });
  // 可选：自动取消双方关注
  await supabase
    .from('follows')
    .delete()
    .or(`and(follower_id.eq.${currentUserId},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${currentUserId})`);
  res.json({ success: true, message: '已拉黑用户' });
});

// 登录记录
router.get('/login-history', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  res.json({ success: true, data });
});


module.exports = router;