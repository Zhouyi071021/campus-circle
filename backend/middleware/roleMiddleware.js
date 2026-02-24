// 普通管理员（或超级管理员）
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, error: '未认证' });
  const role = req.user.role;
  if (role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({ success: false, error: '需要管理员权限' });
  }
  next();
}

// 超级管理员
function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, error: '未认证' });
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: '需要超级管理员权限' });
  }
  next();
}

// 任何管理员（用于仪表盘等）
function requireAnyAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, error: '未认证' });
  const role = req.user.role;
  if (!['admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, error: '需要管理员权限' });
  }
  next();
}

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requireAnyAdmin,
};