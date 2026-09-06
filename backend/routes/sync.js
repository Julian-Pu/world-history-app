const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

// 获取同步状态
router.get('/status', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT last_sync_at, storage_mode FROM users WHERE id = ?').get(req.userId);

    // 统计各类数据数量
    const stats = {
      progress: db.prepare('SELECT COUNT(*) as count FROM learning_progress WHERE user_id = ?').get(req.userId).count,
      notes: db.prepare("SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND deleted = 0").get(req.userId).count,
      favorites: db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.userId).count,
      quiz_records: db.prepare('SELECT COUNT(*) as count FROM quiz_records WHERE user_id = ?').get(req.userId).count,
      wrong_questions: db.prepare('SELECT COUNT(*) as count FROM wrong_questions WHERE user_id = ?').get(req.userId).count,
      achievements: db.prepare('SELECT COUNT(*) as count FROM achievements WHERE user_id = ?').get(req.userId).count,
    };

    // 待同步的操作数
    const pendingOps = db.prepare('SELECT COUNT(*) as count FROM sync_log WHERE user_id = ?').get(req.userId).count;

    return successResponse(res, {
      last_sync_at: user.last_sync_at,
      storage_mode: user.storage_mode,
      stats,
      pending_operations: pendingOps,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(res, '获取同步状态失败：' + error.message, 500);
  }
});

// 推送本地变更到云端（增量同步）
router.post('/push', authenticate, (req, res) => {
  try {
    const { changes, last_sync_at } = req.body;

    if (!Array.isArray(changes)) {
      return errorResponse(res, '变更数据格式错误');
    }

    let pushed = 0;
    let conflicts = [];

    const tx = db.transaction(() => {
      for (const change of changes) {
        const { entity_type, entity_id, operation, data, timestamp } = change;

        // 检查冲突：服务端是否有更新的修改
        const serverChange = db.prepare(`
          SELECT timestamp FROM sync_log
          WHERE user_id = ? AND entity_type = ? AND entity_id = ?
          ORDER BY timestamp DESC LIMIT 1
        `).get(req.userId, entity_type, entity_id);

        if (serverChange && last_sync_at && new Date(serverChange.timestamp) > new Date(last_sync_at)) {
          conflicts.push({ entity_type, entity_id, reason: 'server_has_newer_version' });
          continue;
        }

        // 应用变更
        switch (entity_type) {
          case 'progress':
            applyProgressChange(req.userId, entity_id, operation, data);
            break;
          case 'note':
            applyNoteChange(req.userId, entity_id, operation, data);
            break;
          case 'favorite':
            applyFavoriteChange(req.userId, entity_id, operation, data);
            break;
          case 'quiz_record':
            applyQuizRecordChange(req.userId, entity_id, operation, data);
            break;
          case 'wrong_question':
            applyWrongQuestionChange(req.userId, entity_id, operation, data);
            break;
          case 'achievement':
            applyAchievementChange(req.userId, entity_id, operation, data);
            break;
          case 'study_session':
            applyStudySessionChange(req.userId, entity_id, operation, data);
            break;
          default:
            continue;
        }

        // 记录同步日志
        db.prepare(`
          INSERT INTO sync_log (user_id, entity_type, entity_id, operation, payload, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.userId, entity_type, entity_id, operation, JSON.stringify(data || {}), timestamp || new Date().toISOString());

        pushed++;
      }

      // 更新最后同步时间
      db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.userId);
    });

    tx();

    return successResponse(res, { pushed, conflicts, total: changes.length }, '推送完成');
  } catch (error) {
    console.error('同步推送错误:', error);
    return errorResponse(res, '推送失败：' + error.message, 500);
  }
});

// 从云端拉取变更（增量同步）
router.post('/pull', authenticate, (req, res) => {
  try {
    const { last_sync_at } = req.body;

    let where = ['user_id = ?'];
    let params = [req.userId];

    if (last_sync_at) {
      where.push('timestamp > ?');
      params.push(last_sync_at);
    }

    const changes = db.prepare(`
      SELECT entity_type, entity_id, operation, payload, timestamp
      FROM sync_log
      WHERE ${where.join(' AND ')}
      ORDER BY timestamp ASC
    `).all(...params);

    // 解析payload
    const parsedChanges = changes.map(c => ({
      ...c,
      data: c.payload ? JSON.parse(c.payload) : null,
    }));

    // 更新最后同步时间
    db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.userId);

    return successResponse(res, {
      changes: parsedChanges,
      count: parsedChanges.length,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(res, '拉取失败：' + error.message, 500);
  }
});

// 全量同步（推送所有本地数据 + 拉取所有云端数据）
router.post('/full', authenticate, (req, res) => {
  try {
    const { local_data } = req.body;

    const tx = db.transaction(() => {
      // 清空用户现有数据（全量替换）
      db.prepare('DELETE FROM learning_progress WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM notes WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM favorites WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM quiz_records WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM wrong_questions WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM achievements WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM study_sessions WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM daily_stats WHERE user_id = ?').run(req.userId);
      db.prepare('DELETE FROM sync_log WHERE user_id = ?').run(req.userId);

      // 导入本地数据
      if (local_data) {
        if (Array.isArray(local_data.progress)) {
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO learning_progress (id, user_id, content_type, content_id, status, level, last_position, time_spent, first_read_at, last_read_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          local_data.progress.forEach(p => {
            stmt.run(p.id || generateId(), req.userId, p.content_type, p.content_id, p.status || 'unread',
              p.level || null, p.last_position || 0, p.time_spent || 0,
              p.first_read_at || null, p.last_read_at || null, p.completed_at || null);
          });
        }

        if (Array.isArray(local_data.notes)) {
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO notes (id, user_id, content_type, content_id, title, content, created_at, updated_at, deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          local_data.notes.forEach(n => {
            stmt.run(n.id || generateId(), req.userId, n.content_type || null, n.content_id || null,
              n.title || '', n.content || '', n.created_at || new Date().toISOString(),
              n.updated_at || new Date().toISOString(), n.deleted || 0);
          });
        }

        if (Array.isArray(local_data.favorites)) {
          const stmt = db.prepare(`
            INSERT OR IGNORE INTO favorites (id, user_id, content_type, content_id, created_at)
            VALUES (?, ?, ?, ?, ?)
          `);
          local_data.favorites.forEach(f => {
            stmt.run(f.id || generateId(), req.userId, f.content_type, f.content_id, f.created_at || new Date().toISOString());
          });
        }
      }

      db.prepare('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.userId);
    });

    tx();

    // 返回云端全量数据
    const cloudData = getAllUserData(req.userId);

    return successResponse(res, { cloud_data: cloudData, message: '全量同步完成' });
  } catch (error) {
    console.error('全量同步错误:', error);
    return errorResponse(res, '全量同步失败：' + error.message, 500);
  }
});

// 导出用户所有数据
router.get('/export', authenticate, (req, res) => {
  try {
    const data = getAllUserData(req.userId);
    const user = db.prepare('SELECT id, username, email, default_level, storage_mode, theme, font_size, created_at FROM users WHERE id = ?').get(req.userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="history-data-${Date.now()}.json"`);
    res.json({
      export_time: new Date().toISOString(),
      user,
      data,
    });
  } catch (error) {
    return errorResponse(res, '导出失败：' + error.message, 500);
  }
});

// ===== 辅助函数 =====

function getAllUserData(userId) {
  return {
    progress: db.prepare('SELECT * FROM learning_progress WHERE user_id = ?').all(userId),
    notes: db.prepare('SELECT * FROM notes WHERE user_id = ? AND deleted = 0').all(userId),
    favorites: db.prepare('SELECT * FROM favorites WHERE user_id = ?').all(userId),
    quiz_records: db.prepare('SELECT * FROM quiz_records WHERE user_id = ?').all(userId),
    wrong_questions: db.prepare('SELECT * FROM wrong_questions WHERE user_id = ?').all(userId),
    achievements: db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(userId),
    study_sessions: db.prepare('SELECT * FROM study_sessions WHERE user_id = ?').all(userId),
    daily_stats: db.prepare('SELECT * FROM daily_stats WHERE user_id = ?').all(userId),
  };
}

function applyProgressChange(userId, entityId, operation, data) {
  if (operation === 'delete') {
    db.prepare('DELETE FROM learning_progress WHERE id = ? AND user_id = ?').run(entityId, userId);
    return;
  }
  const existing = db.prepare('SELECT id FROM learning_progress WHERE id = ? AND user_id = ?').get(entityId, userId);
  if (existing) {
    db.prepare(`
      UPDATE learning_progress SET status = COALESCE(?, status), level = COALESCE(?, level),
        last_position = COALESCE(?, last_position), time_spent = COALESCE(?, time_spent),
        last_read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(data?.status || null, data?.level || null, data?.last_position ?? null, data?.time_spent ?? null, entityId, userId);
  } else {
    db.prepare(`
      INSERT INTO learning_progress (id, user_id, content_type, content_id, status, level, last_position, time_spent, first_read_at, last_read_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(entityId, userId, data?.content_type, data?.content_id, data?.status || 'reading', data?.level || null, data?.last_position || 0, data?.time_spent || 0);
  }
}

function applyNoteChange(userId, entityId, operation, data) {
  if (operation === 'delete') {
    db.prepare('UPDATE notes SET deleted = 1 WHERE id = ? AND user_id = ?').run(entityId, userId);
    return;
  }
  const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(entityId, userId);
  if (existing) {
    db.prepare('UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
      .run(data?.title || null, data?.content || null, entityId, userId);
  } else {
    db.prepare(`
      INSERT INTO notes (id, user_id, content_type, content_id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(entityId, userId, data?.content_type || null, data?.content_id || null, data?.title || '无标题', data?.content || '');
  }
}

function applyFavoriteChange(userId, entityId, operation, data) {
  if (operation === 'delete') {
    db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?').run(entityId, userId);
    return;
  }
  db.prepare(`
    INSERT OR IGNORE INTO favorites (id, user_id, content_type, content_id, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(entityId, userId, data?.content_type, data?.content_id);
}

function applyQuizRecordChange(userId, entityId, operation, data) {
  if (operation === 'delete') {
    db.prepare('DELETE FROM quiz_records WHERE id = ? AND user_id = ?').run(entityId, userId);
    return;
  }
  const existing = db.prepare('SELECT id FROM quiz_records WHERE id = ? AND user_id = ?').get(entityId, userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO quiz_records (id, user_id, quiz_type, level, total_questions, correct_count, score, time_spent, answers, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(entityId, userId, data?.quiz_type || 'random', data?.level || 'middle',
      data?.total_questions || 0, data?.correct_count || 0, data?.score || 0,
      data?.time_spent || 0, JSON.stringify(data?.answers || []), data?.created_at || new Date().toISOString());
  }
}

function applyWrongQuestionChange(userId, entityId, operation, data) {
  if (operation === 'delete') {
    db.prepare('DELETE FROM wrong_questions WHERE id = ? AND user_id = ?').run(entityId, userId);
    return;
  }
  const existing = db.prepare('SELECT id FROM wrong_questions WHERE id = ? AND user_id = ?').get(entityId, userId);
  if (!existing && data?.quiz_id) {
    db.prepare(`
      INSERT OR IGNORE INTO wrong_questions (id, user_id, quiz_id, user_answer, wrong_count, mastered)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(entityId, userId, data.quiz_id, data?.user_answer || '', data?.wrong_count || 1, data?.mastered || 0);
  }
}

function applyAchievementChange(userId, entityId, operation, data) {
  if (operation === 'delete') return; // 成就不允许删除
  db.prepare(`
    INSERT OR IGNORE INTO achievements (id, user_id, badge_id, unlocked_at)
    VALUES (?, ?, ?, ?)
  `).run(entityId, userId, data?.badge_id, data?.unlocked_at || new Date().toISOString());
}

function applyStudySessionChange(userId, entityId, operation, data) {
  if (operation === 'delete') {
    db.prepare('DELETE FROM study_sessions WHERE id = ? AND user_id = ?').run(entityId, userId);
    return;
  }
  const existing = db.prepare('SELECT id FROM study_sessions WHERE id = ? AND user_id = ?').get(entityId, userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO study_sessions (id, user_id, start_time, end_time, duration, content_type, content_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(entityId, userId, data?.start_time, data?.end_time || null, data?.duration || 0,
      data?.content_type || null, data?.content_id || null, data?.created_at || new Date().toISOString());
  } else {
    db.prepare('UPDATE study_sessions SET end_time = ?, duration = ? WHERE id = ? AND user_id = ?')
      .run(data?.end_time || null, data?.duration || 0, entityId, userId);
  }
}

module.exports = router;
