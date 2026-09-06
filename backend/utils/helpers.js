const crypto = require('crypto');

// 生成 UUID
function generateId() {
  return crypto.randomUUID();
}

// 生成短ID（用于内容数据）
function generateShortId(prefix = '') {
  const id = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

// 标准化响应
function successResponse(res, data = null, message = 'success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function errorResponse(res, error, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message,
    timestamp: new Date().toISOString(),
  });
}

// 分页参数解析
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// 验证邮箱格式
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证用户名格式（3-20位，字母数字下划线中文）
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$/;
  return usernameRegex.test(username);
}

// 密码强度检查
function checkPasswordStrength(password) {
  const result = { score: 0, feedback: [] };
  if (password.length >= 8) result.score++;
  else result.feedback.push('密码至少8位');
  if (/[a-z]/.test(password)) result.score++;
  if (/[A-Z]/.test(password)) result.score++;
  if (/[0-9]/.test(password)) result.score++;
  if (/[^a-zA-Z0-9]/.test(password)) result.score++;
  if (result.score < 3) result.feedback.push('建议包含大小写字母、数字和特殊字符');
  return result;
}

// 记录同步日志
function logSync(db, userId, entityType, entityId, operation, payload = null) {
  const stmt = db.prepare(`
    INSERT INTO sync_log (user_id, entity_type, entity_id, operation, payload)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(userId, entityType, entityId, operation, payload ? JSON.stringify(payload) : null);
}

// 更新每日统计
function updateDailyStats(db, userId, field, increment = 1) {
  const today = new Date().toISOString().split('T')[0];
  const id = generateId();

  const upsert = db.prepare(`
    INSERT INTO daily_stats (id, user_id, date, ${field})
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET ${field} = ${field} + excluded.${field}
  `);
  upsert.run(id, userId, today, increment);
}

// 检查并解锁成就
function checkAchievements(db, userId) {
  const unlocked = [];

  // 获取用户统计
  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(study_duration), 0) as total_duration,
      COALESCE(SUM(events_read), 0) as total_events,
      COALESCE(SUM(quizzes_taken), 0) as total_quizzes,
      COUNT(DISTINCT date) as active_days
    FROM daily_stats WHERE user_id = ?
  `).get(userId);

  // 已解锁的成就
  const existing = db.prepare('SELECT badge_id FROM achievements WHERE user_id = ?').all(userId);
  const existingSet = new Set(existing.map(e => e.badge_id));

  const badges = [
    { id: 'first_step', name: '初出茅庐', condition: () => stats.total_events >= 1 },
    { id: 'reader_10', name: '勤学不倦', condition: () => stats.total_events >= 10 },
    { id: 'reader_50', name: '博闻强识', condition: () => stats.total_events >= 50 },
    { id: 'quiz_beginner', name: '小试牛刀', condition: () => stats.total_quizzes >= 1 },
    { id: 'quiz_master', name: '考场老手', condition: () => stats.total_quizzes >= 50 },
    { id: 'time_1h', name: '时光旅人', condition: () => stats.total_duration >= 3600 },
    { id: 'time_10h', name: '历史深耕者', condition: () => stats.total_duration >= 36000 },
    { id: 'streak_3', name: '三日不辍', condition: () => stats.active_days >= 3 },
    { id: 'streak_7', name: '一周坚持', condition: () => stats.active_days >= 7 },
    { id: 'streak_30', name: '月度达人', condition: () => stats.active_days >= 30 },
  ];

  const insert = db.prepare('INSERT INTO achievements (id, user_id, badge_id) VALUES (?, ?, ?)');
  for (const badge of badges) {
    if (!existingSet.has(badge.id) && badge.condition()) {
      insert.run(generateId(), userId, badge.id);
      unlocked.push(badge);
    }
  }

  return unlocked;
}

module.exports = {
  generateId,
  generateShortId,
  successResponse,
  errorResponse,
  parsePagination,
  isValidEmail,
  isValidUsername,
  checkPasswordStrength,
  logSync,
  updateDailyStats,
  checkAchievements,
};
