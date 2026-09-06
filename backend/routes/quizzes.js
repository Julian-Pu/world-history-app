const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, parsePagination, updateDailyStats, logSync } = require('../utils/helpers');

const router = express.Router();

// 获取题目列表
router.get('/', optionalAuth, (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { level, period, region, category, type, keyword } = req.query;

    let where = [];
    let params = [];

    if (level) { where.push('level = ?'); params.push(level); }
    if (period) { where.push('period = ?'); params.push(period); }
    if (region) { where.push('region = ?'); params.push(region); }
    if (category) { where.push('category = ?'); params.push(category); }
    if (type) { where.push('type = ?'); params.push(type); }
    if (keyword) { where.push('question LIKE ?'); params.push(`%${keyword}%`); }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM quizzes ${whereClause}`).get(...params);

    const quizzes = db.prepare(`
      SELECT id, question, type, options, correct_answer, analysis, level, period, region, category, difficulty
      FROM quizzes ${whereClause}
      ORDER BY id
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    quizzes.forEach(q => { q.options = JSON.parse(q.options || '[]'); });

    return successResponse(res, {
      list: quizzes,
      pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    });
  } catch (error) {
    return errorResponse(res, '获取题目列表失败：' + error.message, 500);
  }
});

// 随机组卷
router.get('/random', optionalAuth, (req, res) => {
  try {
    const { count = 10, level, period, region, category } = req.query;
    const limit = Math.min(50, Math.max(1, parseInt(count)));

    let where = [];
    let params = [];

    if (level) { where.push('level = ?'); params.push(level); }
    if (period) { where.push('period = ?'); params.push(period); }
    if (region) { where.push('region = ?'); params.push(region); }
    if (category) { where.push('category = ?'); params.push(category); }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const quizzes = db.prepare(`
      SELECT id, question, type, options, correct_answer, analysis, level, period, region, category, difficulty
      FROM quizzes ${whereClause}
      ORDER BY RANDOM()
      LIMIT ?
    `).all(...params, limit);

    quizzes.forEach(q => { q.options = JSON.parse(q.options || '[]'); });

    return successResponse(res, quizzes);
  } catch (error) {
    return errorResponse(res, '组卷失败：' + error.message, 500);
  }
});

// 提交测验结果
router.post('/submit', authenticate, (req, res) => {
  try {
    const { quiz_type, level, total_questions, correct_count, score, time_spent, answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return errorResponse(res, '答题记录不能为空');
    }

    const recordId = generateId();
    db.prepare(`
      INSERT INTO quiz_records (id, user_id, quiz_type, level, total_questions, correct_count, score, time_spent, answers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(recordId, req.userId, quiz_type || 'random', level || 'middle',
      total_questions || answers.length, correct_count || 0, score || 0,
      time_spent || 0, JSON.stringify(answers));

    // 记录错题
    const wrongStmt = db.prepare(`
      INSERT INTO wrong_questions (id, user_id, quiz_id, user_answer, wrong_count, last_wrong_at)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, quiz_id) DO UPDATE SET
        wrong_count = wrong_count + 1,
        user_answer = excluded.user_answer,
        last_wrong_at = CURRENT_TIMESTAMP,
        mastered = 0
    `);

    answers.forEach(answer => {
      if (!answer.is_correct && answer.quiz_id) {
        wrongStmt.run(generateId(), req.userId, answer.quiz_id, answer.user_answer || '');
      }
    });

    // 更新每日统计
    updateDailyStats(db, req.userId, 'quizzes_taken', 1);
    updateDailyStats(db, req.userId, 'quizzes_correct', correct_count || 0);

    // 记录同步日志
    logSync(db, req.userId, 'quiz_record', recordId, 'create', { score, correct_count });

    return successResponse(res, { id: recordId, score, correct_count, total: answers.length }, '测验已提交');
  } catch (error) {
    return errorResponse(res, '提交测验失败：' + error.message, 500);
  }
});

// 获取测验历史记录
router.get('/records', authenticate, (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const records = db.prepare(`
      SELECT id, quiz_type, level, total_questions, correct_count, score, time_spent, created_at
      FROM quiz_records WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset);

    const countResult = db.prepare('SELECT COUNT(*) as total FROM quiz_records WHERE user_id = ?').get(req.userId);

    return successResponse(res, {
      list: records,
      pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    });
  } catch (error) {
    return errorResponse(res, '获取测验记录失败：' + error.message, 500);
  }
});

// 获取错题本
router.get('/wrong-questions', authenticate, (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { mastered, level, period } = req.query;

    let where = ['wq.user_id = ?'];
    let params = [req.userId];

    if (mastered !== undefined) {
      where.push('wq.mastered = ?');
      params.push(mastered === 'true' ? 1 : 0);
    }
    if (level) { where.push('q.level = ?'); params.push(level); }
    if (period) { where.push('q.period = ?'); params.push(period); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const wrongQuestions = db.prepare(`
      SELECT wq.id, wq.quiz_id, wq.user_answer, wq.wrong_count, wq.last_wrong_at, wq.mastered,
             q.question, q.type, q.options, q.correct_answer, q.analysis, q.level, q.period, q.category
      FROM wrong_questions wq
      JOIN quizzes q ON wq.quiz_id = q.id
      ${whereClause}
      ORDER BY wq.last_wrong_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    wrongQuestions.forEach(wq => { wq.options = JSON.parse(wq.options || '[]'); });

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM wrong_questions wq
      JOIN quizzes q ON wq.quiz_id = q.id
      ${whereClause}
    `).get(...params);

    return successResponse(res, {
      list: wrongQuestions,
      pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    });
  } catch (error) {
    return errorResponse(res, '获取错题本失败：' + error.message, 500);
  }
});

// 标记错题已掌握
router.put('/wrong-questions/:id/master', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('UPDATE wrong_questions SET mastered = 1 WHERE id = ? AND user_id = ?').run(id, req.userId);
    if (result.changes === 0) {
      return errorResponse(res, '错题记录不存在', 404);
    }
    return successResponse(res, null, '已标记为掌握');
  } catch (error) {
    return errorResponse(res, '操作失败：' + error.message, 500);
  }
});

module.exports = router;
