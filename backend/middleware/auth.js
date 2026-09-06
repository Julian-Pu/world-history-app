const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { errorResponse } = require('../utils/helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

// 认证中间件 - 验证JWT令牌
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, '未提供认证令牌', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // 验证用户是否存在
    const user = db.prepare('SELECT id, username, email, default_level, storage_mode, theme, font_size FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return errorResponse(res, '用户不存在', 401);
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, '认证令牌已过期', 401);
    }
    return errorResponse(res, '无效的认证令牌', 401);
  }
}

// 可选认证 - 有令牌则解析，没有则继续（游客模式）
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, email, default_level, storage_mode FROM users WHERE id = ?').get(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    next();
  } catch (error) {
    next();
  }
}

// 生成JWT令牌
function generateToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 刷新令牌
function refreshToken(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, '未提供认证令牌', 401);
    }

    const token = authHeader.substring(7);
    // 验证令牌（即使过期也尝试解析）
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        decoded = jwt.decode(token);
      } else {
        throw e;
      }
    }

    if (!decoded || !decoded.userId) {
      return errorResponse(res, '无效的令牌', 401);
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return errorResponse(res, '用户不存在', 401);
    }

    const newToken = generateToken(user.id);
    return res.json({
      success: true,
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (error) {
    return errorResponse(res, '刷新令牌失败', 401);
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  generateToken,
  refreshToken,
  JWT_SECRET,
};
