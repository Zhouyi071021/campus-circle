const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const userService = require('../services/userService');
const auth = require('../utils/auth');
const authenticateToken = require('../middleware/authMiddleware');
const supabase = require('../utils/supabase');

// ---------- 静态路由（无需认证）----------
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const exists = await userService.checkUsernameExists(username);
    res.json({ success: true, exists });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 注册
const registerValidation = [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度3-20字符')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字、下划线'),
  body('password').isLength({ min: 8, max: 20 }).withMessage('密码长度8-20字符'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password)
    .withMessage('两次密码输入不一致'),
  body('schoolId').optional().isInt(),
];
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { username, password, schoolId, qq, wechat, email, phone, avatar_url } = req.body;
  try {
    const exists = await userService.checkUsernameExists(username);
    if (exists) return res.status(409).json({ success: false, error: '用户名已存在' });
    const hashedPassword = auth.hashPassword(password);
    const userData = {
      username,
      password_hash: hashedPassword,
      school_id: schoolId || null,
      qq: qq || null,
      wechat: wechat || null,
      email: email || null,
      phone: phone || null,
      avatar_url: avatar_url || 'default_avatar.png',
      role: 'user',
    };
    const newUser = await userService.createUser(userData);
    const fullUser = await userService.getUserById(newUser.id);
    // ✅ 传入完整用户对象，包含 role
    const token = auth.generateToken(fullUser);
    const { password_hash, ...userInfo } = fullUser;
    res.status(201).json({ success: true, data: { user: userInfo, token } });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 登录
const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
];
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const { username, password } = req.body;
  try {
    const user = await userService.findUserByUsername(username);
    if (!user) return res.status(401).json({ success: false, error: '用户名或密码错误' });
    const isValid = auth.comparePassword(password, user.password_hash);
    if (!isValid) return res.status(401).json({ success: false, error: '用户名或密码错误' });
    // ✅ 传入完整用户对象，包含 role
    const token = auth.generateToken(user);

    // 更新最后登录时间
    await supabase.from('users').update({ last_login: new Date() }).eq('id', user.id).maybeSingle();

    // 记录登录历史（如果表存在）
    await supabase.from('login_history').insert({
      user_id: user.id,
      ip: req.ip || req.connection.remoteAddress,
      device: req.headers['user-agent'] || '',
    });

    const { password_hash, ...userInfo } = user;
    res.json({ success: true, data: { user: userInfo, token } });
  } catch (err) {
    console.error('登录系统错误:', err);
    res.status(500).json({ success: false, error: '服务器错误，请稍后重试' });
  }
});

// ---------- 静态路由（需认证）----------
router.put('/profile', authenticateToken, async (req, res) => {
  const updates = req.body;
  delete updates.id;
  delete updates.role;
  delete updates.created_at;
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

// 当前用户的收藏列表
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getUserCollections(req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 当前用户的评论列表
router.get('/comments', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getUserComments(req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 当前用户的帖子列表
router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getUserPosts(req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 当前用户的关注列表（带互关状态）
router.get('/me/following', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getFollowingWithStatus(req.user.id, req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 当前用户的粉丝列表（带互关状态）
router.get('/me/followers', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getFollowersWithStatus(req.user.id, req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- 动态路由（公开）----------
// 注意：以下路由必须放在 /:id 基础路由之前，否则会被捕获

// 获取用户的帖子列表（公开）
router.get('/:id/posts', async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getUserPosts(userId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取用户的评论列表（公开）
router.get('/:id/comments', async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getUserComments(userId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取用户的收藏列表（公开）
router.get('/:id/collections', async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getUserCollections(userId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取用户的粉丝列表（公开）
router.get('/:id/followers', async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getFollowers(userId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取用户的关注列表（公开）
router.get('/:id/following', async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await userService.getFollowing(userId, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 检查当前用户是否已关注目标用户（需认证）
router.get('/:id/follow-status', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentUserId)
      .eq('following_id', targetId);
    res.json({ success: true, isFollowing: count > 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取用户公开信息（基础路由，必须放在最后）
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserPublicInfo(userId);
    if (!user) return res.status(404).json({ success: false, error: '用户不存在' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- 动态路由（需认证，关注/取消关注）----------
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;
    if (currentUserId === targetId) return res.status(400).json({ success: false, error: '不能关注自己' });
    const result = await userService.follow(currentUserId, targetId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('关注失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;
    await userService.unfollow(currentUserId, targetId);
    res.json({ success: true });
  } catch (err) {
    console.error('取消关注失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;