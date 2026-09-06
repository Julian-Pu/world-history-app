const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, parsePagination, logSync, updateDailyStats } = require('../utils/helpers');

const router = express.Router();

// 获取笔记列表
router.get('/', authenticate, (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { content_type, content_id, keyword } = req.query;

    let where = ['user_id = ?', 'deleted = 0'];
    let params = [req.userId];

    if (content_type) { where.push('content_type = ?'); params.push(content_type); }
    if (content_id) { where.push('content_id = ?'); params.push(content_id); }
    if (keyword) {
      where.push('(title LIKE ? OR content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');
    const notes = db.prepare(`
      SELECT id, content_type, content_id, title, content, created_at, updated_at
      FROM notes ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM notes ${whereClause}`).get(...params);

    return successResponse(res, {
      list: notes,
      pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    });
  } catch (error) {
    return errorResponse(res, '获取笔记列表失败：' + error.message, 500);
  }
});

// 获取单条笔记
router.get('/:id', authenticate, (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted = 0').get(req.params.id, req.userId);
    if (!note) return errorResponse(res, '笔记不存在', 404);
    return successResponse(res, note);
  } catch (error) {
    return errorResponse(res, '获取笔记失败：' + error.message, 500);
  }
});

// 创建笔记
router.post('/', authenticate, (req, res) => {
  try {
    const { content_type, content_id, title, content } = req.body;
    if (!content || content.trim().length === 0) {
      return errorResponse(res, '笔记内容不能为空');
    }

    const noteId = generateId();
    db.prepare(`
      INSERT INTO notes (id, user_id, content_type, content_id, title, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(noteId, req.userId, content_type || null, content_id || null, title || '无标题', content);

    updateDailyStats(db, req.userId, 'notes_created', 1);
    logSync(db, req.userId, 'note', noteId, 'create', { title });

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
    return successResponse(res, note, '笔记创建成功', 201);
  } catch (error) {
    return errorResponse(res, '创建笔记失败：' + error.message, 500);
  }
});

// 更新笔记
router.put('/:id', authenticate, (req, res) => {
  try {
    const { title, content } = req.body;
    const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ? AND deleted = 0').get(req.params.id, req.userId);
    if (!existing) return errorResponse(res, '笔记不存在', 404);

    db.prepare(`
      UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(title || null, content || null, req.params.id, req.userId);

    logSync(db, req.userId, 'note', req.params.id, 'update', { title });
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    return successResponse(res, note, '笔记已更新');
  } catch (error) {
    return errorResponse(res, '更新笔记失败：' + error.message, 500);
  }
});

// 删除笔记（软删除）
router.delete('/:id', authenticate, (req, res) => {
  try {
    const result = db.prepare('UPDATE notes SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return errorResponse(res, '笔记不存在', 404);
    logSync(db, req.userId, 'note', req.params.id, 'delete');
    return successResponse(res, null, '笔记已删除');
  } catch (error) {
    return errorResponse(res, '删除笔记失败：' + error.message, 500);
  }
});

module.exports = router;
