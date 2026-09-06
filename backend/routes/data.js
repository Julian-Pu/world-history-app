const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 清除用户云端数据
// POST /api/data/clear
// body: { types: ['progress', 'notes', 'favorites', 'quizRecords', 'wrongQuestions', 'achievements', 'studyTime'] }
router.post('/clear', authenticate, (req, res) => {
  const userId = req.user.userId;
  const { types } = req.body;

  if (!Array.isArray(types) || types.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请指定要清除的数据类型',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const cleared = [];

    // 清除学习进度
    if (types.includes('progress')) {
      db.prepare('DELETE FROM learning_progress WHERE user_id = ?').run(userId);
      cleared.push('progress');
    }

    // 清除收藏
    if (types.includes('favorites')) {
      db.prepare('DELETE FROM favorites WHERE user_id = ?').run(userId);
      cleared.push('favorites');
    }

    // 清除笔记
    if (types.includes('notes')) {
      db.prepare('DELETE FROM notes WHERE user_id = ?').run(userId);
      cleared.push('notes');
    }

    // 清除测验记录
    if (types.includes('quizRecords')) {
      db.prepare('DELETE FROM quiz_records WHERE user_id = ?').run(userId);
      cleared.push('quizRecords');
    }

    // 清除错题本（如果有表）
    if (types.includes('wrongQuestions')) {
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wrong_questions'").get();
      if (tableCheck) {
        db.prepare('DELETE FROM wrong_questions WHERE user_id = ?').run(userId);
      }
      cleared.push('wrongQuestions');
    }

    // 清除成就
    if (types.includes('achievements')) {
      db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(userId);
      cleared.push('achievements');
    }

    // 清除学习时长
    if (types.includes('studyTime')) {
      db.prepare('DELETE FROM study_sessions WHERE user_id = ?').run(userId);
      // 重置用户统计
      db.prepare('UPDATE users SET total_study_minutes = 0, streak_days = 0, last_study_date = NULL WHERE id = ?').run(userId);
      cleared.push('studyTime');
    }

    return res.json({
      success: true,
      message: '云端数据清除成功',
      data: { cleared },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('清除云端数据失败:', error);
    return res.status(500).json({
      success: false,
      message: '清除云端数据失败',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
