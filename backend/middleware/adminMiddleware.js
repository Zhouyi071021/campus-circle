function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: '需要管理员权限' });
  }
}
module.exports = adminOnly;