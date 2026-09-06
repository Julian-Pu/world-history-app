const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, logSync, updateDailyStats, checkAchievements } = require('../utils/helpers');

const router = express.Router();

// 开始学习会话（前端进入学习页面时调用）
router.post('/start', authenticate, (req, res) => {
  try {
    const { content_type, content_id } = req.body;

    // 检查是否有未结束的会话
    const activeSession = db.prepare(`
      SELECT id FROM study_sessions
      WHERE user_id = ? AND end_time IS NULL
      ORDER BY start_time DESC LIMIT 1
    `).get(req.userId);

    if (activeSession) {
      // 自动结束之前的会话
      const duration = Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000);
      db.prepare('UPDATE study_sessions SET end_time = CURRENT_TIMESTAMP, duration = ? WHERE id = ?')
        .run(Math.max(0, duration), activeSession.id);
      updateDailyStats(db, req.userId, 'study_duration', Math.max(0, duration));
    }

    const sessionId = generateId();
    db.prepare(`
      INSERT INTO study_sessions (id, user_id, start_time, content_type, content_id)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
    `).run(sessionId, req.userId, content_type || null, content_id || null);

    logSync(db, req.userId, 'study_session', sessionId, 'create', { content_type, content_id });

    return successResponse(res, {
      session_id: sessionId,
      start_time: new Date().toISOString(),
    }, '学习计时已开始', 201);
  } catch (error) {
    return errorResponse(res, '开始计时失败：' + error.message, 500);
  }
});

// 结束学习会话（前端离开学习页面时调用）
router.post('/:id/end', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    const session = db.prepare('SELECT * FROM study_sessions WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!session) {
      return errorResponse(res, '学习会话不存在', 404);
    }
    if (session.end_time) {
      return errorResponse(res, '该会话已结束');
    }

    // 计算时长：优先使用前端传入的duration，否则用服务端时间差
    let finalDuration;
    if (duration !== undefined && duration !== null) {
      finalDuration = Math.max(0, parseInt(duration));
    } else {
      finalDuration = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000);
    }

    db.prepare('UPDATE study_sessions SET end_time = CURRENT_TIMESTAMP, duration = ? WHERE id = ?')
      .run(finalDuration, id);

    // 更新每日统计
    if (finalDuration > 0) {
      updateDailyStats(db, req.userId, 'study_duration', finalDuration);
    }

    // 检查成就
    const newAchievements = checkAchievements(db, req.userId);

    logSync(db, req.userId, 'study_session', id, 'update', { duration: finalDuration, end_time: new Date().toISOString() });

    return successResponse(res, {
      session_id: id,
      duration: finalDuration,
      end_time: new Date().toISOString(),
      new_achievements: newAchievements,
    }, '学习计时已结束');
  } catch (error) {
    return errorResponse(res, '结束计时失败：' + error.message, 500);
  }
});

// 心跳更新（前端每隔一段时间调用，保持会话活跃并更新时长）
router.post('/:id/heartbeat', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { current_duration } = req.body;

    const session = db.prepare('SELECT id FROM study_sessions WHERE id = ? AND user_id = ? AND end_time IS NULL').get(id, req.userId);
    if (!session) {
      return errorResponse(res, '活跃会话不存在', 404);
    }

    // 心跳只更新时间戳，不更新duration（结束时统一计算）
    return successResponse(res, {
      session_id: id,
      server_time: new Date().toISOString(),
      is_active: true,
    });
  } catch (error) {
    return errorResponse(res, '心跳失败：' + error.message, 500);
  }
});

// 获取学习会话历史
router.get('/', authenticate, (req, res) => {
  try {
    const { page, limit, offset } = require('../utils/helpers').parsePagination(req.query);
    const { start_date, end_date, content_type } = req.query;

    let where = ['user_id = ?'];
    let params = [req.userId];

    if (start_date) { where.push('DATE(start_time) >= ?'); params.push(start_date); }
    if (end_date) { where.push('DATE(start_time) <= ?'); params.push(end_date); }
    if (content_type) { where.push('content_type = ?'); params.push(content_type); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const sessions = db.prepare(`
      SELECT id, start_time, end_time, duration, content_type, content_id
      FROM study_sessions ${whereClause}
      ORDER BY start_time DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM study_sessions ${whereClause}`).get(...params);

    return successResponse(res, {
      list: sessions,
      pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    });
  } catch (error) {
    return errorResponse(res, '获取学习记录失败：' + error.message, 500);
  }
});

// 获取当前活跃会话
router.get('/active/current', authenticate, (req, res) => {
  try {
    const activeSession = db.prepare(`
      SELECT id, start_time, content_type, content_id
      FROM study_sessions
      WHERE user_id = ? AND end_time IS NULL
      ORDER BY start_time DESC LIMIT 1
    `).get(req.userId);

    if (!activeSession) {
      return successResponse(res, null);
    }

    const elapsed = Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000);
    return successResponse(res, { ...activeSession, elapsed_seconds: elapsed });
  } catch (error) {
    return errorResponse(res, '获取当前会话失败：' + error.message, 500);
  }
});

module.exports = router;
