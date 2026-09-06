const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

// 获取用户学习总览统计
router.get('/overview', authenticate, (req, res) => {
  try {
    // 总学习时长
    const totalDuration = db.prepare('SELECT COALESCE(SUM(study_duration), 0) as total FROM daily_stats WHERE user_id = ?').get(req.userId).total;

    // 已完成事件数
    const completedEvents = db.prepare("SELECT COUNT(*) as count FROM learning_progress WHERE user_id = ? AND content_type = 'event' AND status = 'completed'").get(req.userId).count;

    // 总事件数
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;

    // 测验次数和正确率
    const quizStats = db.prepare(`
      SELECT
        COUNT(*) as total_quizzes,
        COALESCE(SUM(correct_count), 0) as total_correct,
        COALESCE(SUM(total_questions), 0) as total_questions,
        COALESCE(AVG(score), 0) as avg_score
      FROM quiz_records WHERE user_id = ?
    `).get(req.userId);

    // 笔记数
    const noteCount = db.prepare("SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND deleted = 0").get(req.userId).count;

    // 收藏数
    const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.userId).count;

    // 成就数
    const achievementCount = db.prepare('SELECT COUNT(*) as count FROM achievements WHERE user_id = ?').get(req.userId).count;

    // 活跃天数
    const activeDays = db.prepare('SELECT COUNT(DISTINCT date) as days FROM daily_stats WHERE user_id = ? AND study_duration > 0').get(req.userId).days;

    // 连续学习天数
    const streak = calculateStreak(req.userId);

    return successResponse(res, {
      total_study_duration: totalDuration,
      total_study_duration_formatted: formatDuration(totalDuration),
      completed_events: completedEvents,
      total_events: totalEvents,
      completion_rate: totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0,
      quiz: {
        total_taken: quizStats.total_quizzes,
        total_correct: quizStats.total_correct,
        total_questions: quizStats.total_questions,
        accuracy: quizStats.total_questions > 0 ? Math.round((quizStats.total_correct / quizStats.total_questions) * 100) : 0,
        average_score: Math.round(quizStats.avg_score),
      },
      notes_count: noteCount,
      favorites_count: favoriteCount,
      achievements_count: achievementCount,
      active_days: activeDays,
      current_streak: streak,
    });
  } catch (error) {
    return errorResponse(res, '获取统计失败：' + error.message, 500);
  }
});

// 获取每日学习统计（最近N天）
router.get('/daily', authenticate, (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));

    const stats = db.prepare(`
      SELECT date, study_duration, events_read, quizzes_taken, quizzes_correct, notes_created
      FROM daily_stats
      WHERE user_id = ? AND date >= date('now', ?)
      ORDER BY date ASC
    `).all(req.userId, `-${days - 1} days`);

    // 填充没有数据的日期
    const result = [];
    const statsMap = new Map(stats.map(s => [s.date, s]));
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = statsMap.get(dateStr);
      result.push({
        date: dateStr,
        study_duration: dayData?.study_duration || 0,
        events_read: dayData?.events_read || 0,
        quizzes_taken: dayData?.quizzes_taken || 0,
        quizzes_correct: dayData?.quizzes_correct || 0,
        notes_created: dayData?.notes_created || 0,
      });
    }

    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, '获取每日统计失败：' + error.message, 500);
  }
});

// 获取按时期的学习进度
router.get('/by-period', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        e.period,
        COUNT(DISTINCT e.id) as total,
        COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN e.id END) as completed,
        COALESCE(SUM(CASE WHEN lp.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_count
      FROM events e
      LEFT JOIN learning_progress lp ON e.id = lp.content_id AND lp.content_type = 'event' AND lp.user_id = ?
      GROUP BY e.period
      ORDER BY MIN(e.start_date)
    `).all(req.userId);

    const result = stats.map(s => ({
      period: s.period,
      total: s.total,
      completed: s.completed,
      percentage: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }));

    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, '获取时期进度失败：' + error.message, 500);
  }
});

// 获取按地区的学习进度
router.get('/by-region', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        e.region,
        COUNT(DISTINCT e.id) as total,
        COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN e.id END) as completed
      FROM events e
      LEFT JOIN learning_progress lp ON e.id = lp.content_id AND lp.content_type = 'event' AND lp.user_id = ?
      GROUP BY e.region
    `).all(req.userId);

    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, '获取地区进度失败：' + error.message, 500);
  }
});

// 获取测验成绩趋势
router.get('/quiz-trend', authenticate, (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const records = db.prepare(`
      SELECT id, score, correct_count, total_questions, level, quiz_type, created_at
      FROM quiz_records
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `).all(req.userId, limit);

    return successResponse(res, records);
  } catch (error) {
    return errorResponse(res, '获取测验趋势失败：' + error.message, 500);
  }
});

// 获取学习热力图数据（最近一年）
router.get('/heatmap', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT date, study_duration
      FROM daily_stats
      WHERE user_id = ? AND date >= date('now', '-365 days') AND study_duration > 0
      ORDER BY date ASC
    `).all(req.userId);

    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, '获取热力图数据失败：' + error.message, 500);
  }
});

// ===== 辅助函数 =====

function calculateStreak(userId) {
  const dates = db.prepare(`
    SELECT DISTINCT date FROM daily_stats
    WHERE user_id = ? AND study_duration > 0
    ORDER BY date DESC
  `).all(userId);

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // 如果今天或昨天有学习，开始计算连续天数
  if (dates[0].date === today || dates[0].date === yesterday) {
    streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const expected = new Date(Date.now() - (streak + 1) * 86400000).toISOString().split('T')[0];
      if (dates[i].date === expected) {
        streak++;
      } else {
        break;
      }
    }
  }

  return streak;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
}

module.exports = router;
