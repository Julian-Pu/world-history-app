const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, logSync } = require('../utils/helpers');

const router = express.Router();

// 获取收藏列表
router.get('/', authenticate, (req, res) => {
  try {
    const { content_type } = req.query;
    let where = ['f.user_id = ?'];
    let params = [req.userId];

    if (content_type) { where.push('f.content_type = ?'); params.push(content_type); }

    const favorites = db.prepare(`
      SELECT f.id, f.content_type, f.content_id, f.created_at,
             CASE WHEN f.content_type = 'event' THEN e.title ELSE p.name END as title,
             CASE WHEN f.content_type = 'event' THEN e.start_date ELSE p.birth_year END as date_info,
             CASE WHEN f.content_type = 'event' THEN e.period ELSE p.region END as category
      FROM favorites f
      LEFT JOIN events e ON f.content_type = 'event' AND f.content_id = e.id
      LEFT JOIN people p ON f.content_type = 'person' AND f.content_id = p.id
      WHERE ${where.join(' AND ')}
      ORDER BY f.created_at DESC
    `).all(...params);

    return successResponse(res, favorites);
  } catch (error) {
    return errorResponse(res, '获取收藏列表失败：' + error.message, 500);
  }
});

// 添加收藏
router.post('/', authenticate, (req, res) => {
  try {
    const { content_type, content_id } = req.body;
    if (!content_type || !content_id) {
      return errorResponse(res, '内容类型和内容ID不能为空');
    }

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND content_type = ? AND content_id = ?')
      .get(req.userId, content_type, content_id);
    if (existing) {
      return errorResponse(res, '已经收藏过了');
    }

    const favoriteId = generateId();
    db.prepare('INSERT INTO favorites (id, user_id, content_type, content_id) VALUES (?, ?, ?, ?)')
      .run(favoriteId, req.userId, content_type, content_id);

    logSync(db, req.userId, 'favorite', favoriteId, 'create', { content_type, content_id });
    return successResponse(res, { id: favoriteId }, '收藏成功', 201);
  } catch (error) {
    return errorResponse(res, '收藏失败：' + error.message, 500);
  }
});

// 取消收藏
router.delete('/:id', authenticate, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return errorResponse(res, '收藏记录不存在', 404);
    logSync(db, req.userId, 'favorite', req.params.id, 'delete');
    return successResponse(res, null, '已取消收藏');
  } catch (error) {
    return errorResponse(res, '取消收藏失败：' + error.message, 500);
  }
});

// 按内容ID取消收藏
router.delete('/by-content/:content_type/:content_id', authenticate, (req, res) => {
  try {
    const { content_type, content_id } = req.params;
    const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND content_type = ? AND content_id = ?')
      .run(req.userId, content_type, content_id);
    return successResponse(res, { deleted: result.changes }, '已取消收藏');
  } catch (error) {
    return errorResponse(res, '操作失败：' + error.message, 500);
  }
});

module.exports = router;
