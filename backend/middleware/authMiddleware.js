const { verifyToken } = require('../utils/auth');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('🔐 收到的 authHeader:', authHeader);

  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.warn('❌ 未提供 token');
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      console.warn('❌ 令牌无效或已过期');
      return res.status(403).json({ success: false, error: '令牌无效或已过期' });
    }
    console.log('✅ 令牌验证成功，用户ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ token 验证抛出异常:', err);
    return res.status(403).json({ success: false, error: '令牌验证失败' });
  }
}

module.exports = authenticateToken;