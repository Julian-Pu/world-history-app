const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, generateToken, refreshToken } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, isValidEmail, isValidUsername, checkPasswordStrength } = require('../utils/helpers');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, default_level } = req.body;

    // 参数验证
    if (!username || !email || !password) {
      return errorResponse(res, '用户名、邮箱和密码不能为空');
    }
    if (!isValidUsername(username)) {
      return errorResponse(res, '用户名格式不正确（3-20位，字母数字下划线中文）');
    }
    if (!isValidEmail(email)) {
      return errorResponse(res, '邮箱格式不正确');
    }

    // 密码强度检查
    const strength = checkPasswordStrength(password);
    if (strength.score < 2) {
      return errorResponse(res, '密码强度不足：' + strength.feedback.join('；'));
    }

    // 检查用户名是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return errorResponse(res, '用户名或邮箱已被注册');
    }

    // 创建用户
    const userId = generateId();
    const passwordHash = await bcrypt.hash(password, 12);
    const level = ['kindergarten', 'primary', 'middle', 'high'].includes(default_level) ? default_level : 'middle';

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, default_level, storage_mode)
      VALUES (?, ?, ?, ?, ?, 'cloud')
    `).run(userId, username, email, passwordHash, level);

    // 生成令牌
    const token = generateToken(userId);

    const user = db.prepare('SELECT id, username, email, default_level, storage_mode, theme, font_size, created_at FROM users WHERE id = ?').get(userId);

    return successResponse(res, { user, token }, '注册成功', 201);
  } catch (error) {
    console.error('注册错误:', error);
    return errorResponse(res, '注册失败：' + error.message, 500);
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    // 同时支持 account 和 email 字段
    const { account, email, password } = req.body;
    const loginAccount = account || email;

    if (!loginAccount || !password) {
      return errorResponse(res, '账号和密码不能为空');
    }

    // 支持用户名或邮箱登录
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(loginAccount, loginAccount);
    if (!user) {
      return errorResponse(res, '账号或密码错误', 401);
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return errorResponse(res, '账号或密码错误', 401);
    }

    // 更新最后同步时间
    db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // 生成令牌
    const token = generateToken(user.id);

    const { password_hash, ...userInfo } = user;
    return successResponse(res, { user: userInfo, token }, '登录成功');
  } catch (error) {
    console.error('登录错误:', error);
    return errorResponse(res, '登录失败：' + error.message, 500);
  }
});

// 刷新令牌
router.post('/refresh', refreshToken);

// 获取当前用户信息
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, email, default_level, storage_mode, theme, font_size, created_at, last_sync_at
    FROM users WHERE id = ?
  `).get(req.userId);

  return successResponse(res, user);
});

// 更新用户信息
router.put('/me', authenticate, (req, res) => {
  try {
    const { username, default_level, theme, font_size } = req.body;
    const updates = [];
    const params = [];

    if (username) {
      if (!isValidUsername(username)) {
        return errorResponse(res, '用户名格式不正确');
      }
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.userId);
      if (existing) {
        return errorResponse(res, '用户名已被使用');
      }
      updates.push('username = ?');
      params.push(username);
    }

    if (default_level && ['kindergarten', 'primary', 'middle', 'high'].includes(default_level)) {
      updates.push('default_level = ?');
      params.push(default_level);
    }

    if (theme && ['light', 'dark'].includes(theme)) {
      updates.push('theme = ?');
      params.push(theme);
    }

    if (font_size && ['small', 'medium', 'large'].includes(font_size)) {
      updates.push('font_size = ?');
      params.push(font_size);
    }

    if (updates.length === 0) {
      return errorResponse(res, '没有需要更新的字段');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare('SELECT id, username, email, default_level, storage_mode, theme, font_size FROM users WHERE id = ?').get(req.userId);
    return successResponse(res, user, '更新成功');
  } catch (error) {
    return errorResponse(res, '更新失败：' + error.message, 500);
  }
});

// 修改密码
router.put('/password', authenticate, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return errorResponse(res, '原密码和新密码不能为空');
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const isValid = await bcrypt.compare(old_password, user.password_hash);
    if (!isValid) {
      return errorResponse(res, '原密码不正确');
    }

    const strength = checkPasswordStrength(new_password);
    if (strength.score < 2) {
      return errorResponse(res, '新密码强度不足');
    }

    const newHash = await bcrypt.hash(new_password, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.userId);

    return successResponse(res, null, '密码修改成功');
  } catch (error) {
    return errorResponse(res, '修改密码失败：' + error.message, 500);
  }
});

// 切换存储模式
router.put('/storage-mode', authenticate, (req, res) => {
  try {
    const { storage_mode } = req.body;
    if (!['local', 'cloud'].includes(storage_mode)) {
      return errorResponse(res, '存储模式只能是 local 或 cloud');
    }

    db.prepare('UPDATE users SET storage_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(storage_mode, req.userId);

    return successResponse(res, { storage_mode }, '存储模式已切换');
  } catch (error) {
    return errorResponse(res, '切换失败：' + error.message, 500);
  }
});

// 注销账号
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return errorResponse(res, '请输入密码确认注销');
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return errorResponse(res, '密码不正确');
    }

    // 删除用户（级联删除所有相关数据）
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);

    return successResponse(res, null, '账号已注销，所有数据已删除');
  } catch (error) {
    return errorResponse(res, '注销失败：' + error.message, 500);
  }
});

module.exports = router;
