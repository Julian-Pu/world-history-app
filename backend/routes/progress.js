const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, logSync, updateDailyStats, checkAchievements } = require('../utils/helpers');

const router = express.Router();

// 获取学习进度列表
router.get('/', authenticate, (req, res) => {
  try {
    const { content_type, status, period } = req.query;
    let where = ['lp.user_id = ?'];
    let params = [req.userId];

    if (content_type) { where.push('lp.content_type = ?'); params.push(content_type); }
    if (status) { where.push('lp.status = ?'); params.push(status); }

    const whereClause = 'WHERE ' + where.join(' AND ');
    const progress = db.prepare(`
      SELECT lp.*,
             CASE WHEN lp.content_type = 'event' THEN e.title ELSE p.name END as content_title,
             CASE WHEN lp.content_type = 'event' THEN e.period ELSE NULL END as period
      FROM learning_progress lp
      LEFT JOIN events e ON lp.content_type = 'event' AND lp.content_id = e.id
      LEFT JOIN people p ON lp.content_type = 'person' AND lp.content_id = p.id
      ${whereClause}
      ORDER BY lp.last_read_at DESC
    `).all(...params);

    return successResponse(res, progress);
  } catch (error) {
    return errorResponse(res, '获取学习进度失败：' + error.message, 500);
  }
});

// 更新学习进度
router.post('/update', authenticate, (req, res) => {
  try {
    const { content_type, content_id, status, level, last_position, time_spent } = req.body;

    if (!content_type || !content_id) {
      return errorResponse(res, '内容类型和内容ID不能为空');
    }

    const validStatus = ['unread', 'reading', 'completed'];
    const finalStatus = validStatus.includes(status) ? status : 'reading';

    // 检查是否已有记录
    const existing = db.prepare(`
      SELECT id, time_spent, first_read_at FROM learning_progress
      WHERE user_id = ? AND content_type = ? AND content_id = ?
    `).get(req.userId, content_type, content_id);

    let newAchievements = [];

    if (existing) {
      const totalTime = (existing.time_spent || 0) + (time_spent || 0);
      const completedAt = finalStatus === 'completed' && existing.status !== 'completed' ? new Date().toISOString() : null;

      db.prepare(`
        UPDATE learning_progress SET
          status = ?, level = COALESCE(?, level),
          last_position = COALESCE(?, last_position),
          time_spent = ?,
          last_read_at = CURRENT_TIMESTAMP,
          completed_at = COALESCE(?, completed_at),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(finalStatus, level || null, last_position ?? null, totalTime, completedAt, existing.id);

      if (finalStatus === 'completed' && existing.status !== 'completed') {
        updateDailyStats(db, req.userId, 'events_read', 1);
        newAchievements = checkAchievements(db, req.userId);
      }

      logSync(db, req.userId, 'progress', existing.id, 'update', { content_type, content_id, status: finalStatus });
    } else {
      const progressId = generateId();
      const now = new Date().toISOString();
      const completedAt = finalStatus === 'completed' ? now : null;

      db.prepare(`
        INSERT INTO learning_progress (id, user_id, content_type, content_id, status, level, last_position, time_spent, first_read_at, last_read_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(progressId, req.userId, content_type, content_id, finalStatus, level || null,
        last_position || 0, time_spent || 0, now, now, completedAt);

      if (finalStatus === 'completed') {
        updateDailyStats(db, req.userId, 'events_read', 1);
        newAchievements = checkAchievements(db, req.userId);
      }

      logSync(db, req.userId, 'progress', progressId, 'create', { content_type, content_id });
    }

    return successResponse(res, { status: finalStatus, new_achievements: newAchievements }, '进度已更新');
  } catch (error) {
    return errorResponse(res, '更新进度失败：' + error.message, 500);
  }
});

// 按时期统计学习进度
router.get('/by-period', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        e.period,
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN e.id END) as completed_events,
        COALESCE(SUM(CASE WHEN lp.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_count
      FROM events e
      LEFT JOIN learning_progress lp ON e.id = lp.content_id AND lp.content_type = 'event' AND lp.user_id = ?
      GROUP BY e.period
      ORDER BY MIN(e.start_date)
    `).all(req.userId);

    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, '获取进度统计失败：' + error.message, 500);
  }
});

module.exports = router;
