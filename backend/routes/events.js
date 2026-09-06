const express = require('express');
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { generateId, successResponse, errorResponse, parsePagination } = require('../utils/helpers');

const router = express.Router();

// 获取事件列表（支持筛选和搜索）
router.get('/', optionalAuth, (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { period, region, level, category, keyword, start_date, end_date, sort } = req.query;

    let where = [];
    let params = [];

    if (period) {
      where.push('period = ?');
      params.push(period);
    }
    if (region) {
      where.push('region = ?');
      params.push(region);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (keyword) {
      where.push('(title LIKE ? OR title_en LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (start_date) {
      where.push('start_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      where.push('start_date <= ?');
      params.push(end_date);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const orderBy = sort === 'date_desc' ? 'ORDER BY start_date DESC' : 'ORDER BY start_date ASC';

    // 查询总数
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM events ${whereClause}`).get(...params);

    // 查询列表（只返回基本信息，不返回完整内容）
    const events = db.prepare(`
      SELECT id, title, title_en, start_date, end_date, location, region, period, category, tags, image_url
      FROM events ${whereClause} ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // 如果指定了难度，检查该难度是否有内容
    let filteredEvents = events;
    if (level) {
      filteredEvents = events.filter(e => {
        const contents = JSON.parse(e.level_contents || '{}');
        return contents[level] && contents[level].content && contents[level].content.trim().length > 0;
      });
    }

    return successResponse(res, {
      list: filteredEvents,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    return errorResponse(res, '获取事件列表失败：' + error.message, 500);
  }
});

// 获取事件详情
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);

    if (!event) {
      return errorResponse(res, '事件不存在', 404);
    }

    // 解析JSON字段
    event.level_contents = JSON.parse(event.level_contents || '{}');
    event.related_people = JSON.parse(event.related_people || '[]');
    event.related_events = JSON.parse(event.related_events || '[]');
    event.tags = JSON.parse(event.tags || '[]');

    // 查询关联人物详情
    if (event.related_people.length > 0) {
      const placeholders = event.related_people.map(() => '?').join(',');
      event.people_details = db.prepare(`
        SELECT id, name, name_en, birth_year, death_year, role, image_url
        FROM people WHERE id IN (${placeholders})
      `).all(...event.related_people);
    }

    // 查询关联事件详情
    if (event.related_events.length > 0) {
      const placeholders = event.related_events.map(() => '?').join(',');
      event.events_details = db.prepare(`
        SELECT id, title, start_date, end_date, region, period, image_url
        FROM events WHERE id IN (${placeholders})
      `).all(...event.related_events);
    }

    // 如果用户已登录，查询学习进度
    if (req.userId) {
      const progress = db.prepare(`
        SELECT status, time_spent, last_position, last_read_at, completed_at
        FROM learning_progress
        WHERE user_id = ? AND content_type = 'event' AND content_id = ?
      `).get(req.userId, id);
      event.user_progress = progress || null;

      const favorite = db.prepare(`
        SELECT id FROM favorites WHERE user_id = ? AND content_type = 'event' AND content_id = ?
      `).get(req.userId, id);
      event.is_favorited = !!favorite;
    }

    return successResponse(res, event);
  } catch (error) {
    return errorResponse(res, '获取事件详情失败：' + error.message, 500);
  }
});

// 获取时间线数据（简化版，用于时间线渲染）
router.get('/timeline/data', optionalAuth, (req, res) => {
  try {
    const { period, region, level } = req.query;
    let where = [];
    let params = [];

    if (period) {
      where.push('period = ?');
      params.push(period);
    }
    if (region) {
      where.push('region = ?');
      params.push(region);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const events = db.prepare(`
      SELECT id, title, start_date, end_date, region, period, category, level_contents
      FROM events ${whereClause}
      ORDER BY start_date ASC
    `).all(...params);

    // 按难度过滤并简化数据
    const timelineData = events
      .filter(e => {
        if (!level) return true;
        const contents = JSON.parse(e.level_contents || '{}');
        return contents[level] && contents[level].summary;
      })
      .map(e => {
        const contents = JSON.parse(e.level_contents || '{}');
        const summary = level && contents[level] ? contents[level].summary : '';
        return {
          id: e.id,
          title: e.title,
          start_date: e.start_date,
          end_date: e.end_date,
          region: e.region,
          period: e.period,
          category: e.category,
          summary,
        };
      });

    return successResponse(res, timelineData);
  } catch (error) {
    return errorResponse(res, '获取时间线数据失败：' + error.message, 500);
  }
});

// 按时期分组统计
router.get('/stats/by-period', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT period, COUNT(*) as count
      FROM events
      GROUP BY period
      ORDER BY MIN(start_date)
    `).all();
    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, '获取统计失败：' + error.message, 500);
  }
});

module.exports = router;
