const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '7d';

/**
 * 密码加密
 * @param {string} password 明文密码
 * @returns {string} 哈希后的密码
 */
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

/**
 * 验证密码
 * @param {string} password 明文密码
 * @param {string} hash 哈希密码
 * @returns {boolean} 是否匹配
 */
function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/**
 * 生成 JWT（包含用户角色）
 * @param {object} user 用户对象（必须包含 id, username, role）
 * @returns {string} token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role, // 关键：加入角色
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT
 * @param {string} token
 * @returns {object|null} 解码后的 payload，无效则返回 null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};