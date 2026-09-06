const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

// 徽章定义
const BADGE_DEFINITIONS = [
  { id: 'first_step', name: '初出茅庐', description: '完成第一个历史事件的学习', icon: '🌱', category: 'learning' },
  { id: 'reader_10', name: '勤学不倦', description: '累计学习10个历史事件', icon: '📖', category: 'learning' },
  { id: 'reader_50', name: '博闻强识', description: '累计学习50个历史事件', icon: '📚', category: 'learning' },
  { id: 'reader_100', name: '历史达人', description: '累计学习100个历史事件', icon: '🏆', category: 'learning' },
  { id: 'quiz_beginner', name: '小试牛刀', description: '完成第一次测验', icon: '✏️', category: 'quiz' },
  { id: 'quiz_master', name: '考场老手', description: '累计完成50次测验', icon: '🎯', category: 'quiz' },
  { id: 'quiz_perfect', name: '满分学霸', description: '在一次测验中获得满分', icon: '💯', category: 'quiz' },
  { id: 'time_1h', name: '时光旅人', description: '累计学习时长达到1小时', icon: '⏰', category: 'time' },
  { id: 'time_10h', name: '历史深耕者', description: '累计学习时长达到10小时', icon: '⌛', category: 'time' },
  { id: 'time_100h', name: '史学大师', description: '累计学习时长达到100小时', icon: '🎓', category: 'time' },
  { id: 'streak_3', name: '三日不辍', description: '连续学习3天', icon: '🔥', category: 'streak' },
  { id: 'streak_7', name: '一周坚持', description: '连续学习7天', icon: '🌟', category: 'streak' },
  { id: 'streak_30', name: '月度达人', description: '连续学习30天', icon: '👑', category: 'streak' },
  { id: 'note_first', name: '勤做笔记', description: '创建第一条学习笔记', icon: '📝', category: 'note' },
  { id: 'note_10', name: '笔记达人', description: '累计创建10条笔记', icon: '📒', category: 'note' },
  { id: 'favorite_first', name: '收藏爱好者', description: '收藏第一个内容', icon: '⭐', category: 'favorite' },
  { id: 'ancient_master', name: '古代史达人', description: '完成古代文明时期所有事件学习', icon: '🏛️', category: 'period' },
  { id: 'medieval_master', name: '中世纪学者', description: '完成中世纪时期所有事件学习', icon: '⚔️', category: 'period' },
  { id: 'modern_master', name: '近代探索者', description: '完成近代早期所有事件学习', icon: '⛵', category: 'period' },
  { id: 'industrial_master', name: '工业时代先锋', description: '完成工业革命时代所有事件学习', icon: '🏭', category: 'period' },
  { id: 'contemporary_master', name: '现代世界观察家', description: '完成现代世界所有事件学习', icon: '🌍', category: 'period' },
  { id: 'all_periods', name: '通史大家', description: '完成所有时期的事件学习', icon: '🏆', category: 'period' },
];

// 获取所有徽章定义及用户解锁状态
router.get('/', authenticate, (req, res) => {
  try {
    const unlocked = db.prepare('SELECT badge_id, unlocked_at FROM achievements WHERE user_id = ?').all(req.userId);
    const unlockedSet = new Map(unlocked.map(u => [u.badge_id, u.unlocked_at]));

    const badges = BADGE_DEFINITIONS.map(badge => ({
      ...badge,
      unlocked: unlockedSet.has(badge.id),
      unlocked_at: unlockedSet.get(badge.id) || null,
    }));

    // 按分类统计
    const stats = {
      total: badges.length,
      unlocked: badges.filter(b => b.unlocked).length,
      by_category: {},
    };
    badges.forEach(b => {
      if (!stats.by_category[b.category]) {
        stats.by_category[b.category] = { total: 0, unlocked: 0 };
      }
      stats.by_category[b.category].total++;
      if (b.unlocked) stats.by_category[b.category].unlocked++;
    });

    return successResponse(res, { badges, stats });
  } catch (error) {
    return errorResponse(res, '获取成就失败：' + error.message, 500);
  }
});

// 获取最近解锁的成就
router.get('/recent', authenticate, (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 5);
    const recent = db.prepare(`
      SELECT a.badge_id, a.unlocked_at
      FROM achievements a
      WHERE a.user_id = ?
      ORDER BY a.unlocked_at DESC
      LIMIT ?
    `).all(req.userId, limit);

    const badges = recent.map(r => {
      const def = BADGE_DEFINITIONS.find(b => b.id === r.badge_id);
      return def ? { ...def, unlocked_at: r.unlocked_at } : null;
    }).filter(Boolean);

    return successResponse(res, badges);
  } catch (error) {
    return errorResponse(res, '获取最近成就失败：' + error.message, 500);
  }
});

module.exports = router;
module.exports.BADGE_DEFINITIONS = BADGE_DEFINITIONS;
