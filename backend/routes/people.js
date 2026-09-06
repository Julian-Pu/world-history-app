const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 简单的UUID生成函数
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 获取所有人物（带关系数量）
router.get('/', (req, res) => {
  try {
    const people = db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM person_relations pr WHERE pr.person_id = p.id OR pr.related_person_id = p.id) as relation_count
      FROM people p
      ORDER BY p.birth_year
    `).all();
    
    return res.json({
      success: true,
      data: people,
      total: people.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 获取人物详情
router.get('/:id', (req, res) => {
  try {
    const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: '人物不存在' });
    }
    
    // 获取该人物的所有关系
    const relations = db.prepare(`
      SELECT pr.*, 
        CASE WHEN pr.person_id = ? THEN p2.name ELSE p1.name END as related_name,
        CASE WHEN pr.person_id = ? THEN p2.id ELSE p1.id END as related_id
      FROM person_relations pr
      JOIN people p1 ON pr.person_id = p1.id
      JOIN people p2 ON pr.related_person_id = p2.id
      WHERE pr.person_id = ? OR pr.related_person_id = ?
    `).all(req.params.id, req.params.id, req.params.id, req.params.id);
    
    return res.json({
      success: true,
      data: { ...person, relations },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 获取人物关系网络（用于图谱展示）
router.get('/network/graph', (req, res) => {
  try {
    const { limit = 50, era } = req.query;
    
    // 获取人物节点
    let peopleQuery = 'SELECT id, name, dynasty, role, region FROM people';
    const params = [];
    if (era) {
      peopleQuery += ' WHERE dynasty LIKE ?';
      params.push(`%${era}%`);
    }
    peopleQuery += ' ORDER BY birth_year LIMIT ?';
    params.push(parseInt(limit));
    
    const people = db.prepare(peopleQuery).all(...params);
    const personIds = people.map(p => p.id);
    
    // 获取这些人物之间的关系
    const placeholders = personIds.map(() => '?').join(',');
    const relations = db.prepare(`
      SELECT pr.person_id, pr.related_person_id, pr.relation_type, pr.description
      FROM person_relations pr
      WHERE pr.person_id IN (${placeholders}) 
        AND pr.related_person_id IN (${placeholders})
    `).all(...personIds, ...personIds);
    
    // 构建图谱数据
    const nodes = people.map(p => ({
      id: p.id,
      name: p.name,
      category: p.dynasty || p.role || '其他',
      role: p.role,
      symbolSize: 30,
    }));
    
    const links = relations.map(r => ({
      source: r.person_id,
      target: r.related_person_id,
      label: { show: true, formatter: r.relation_type, fontSize: 10 },
      lineStyle: { width: 2, curveness: 0.1 },
      relation_type: r.relation_type,
    }));
    
    return res.json({
      success: true,
      data: { nodes, links },
      nodeCount: nodes.length,
      linkCount: links.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 添加人物关系
router.post('/relations', (req, res) => {
  try {
    const { person_id, related_person_id, relation_type, description, start_year, end_year } = req.body;
    
    if (!person_id || !related_person_id || !relation_type) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const id = uuidv4();
    db.prepare(`
      INSERT OR IGNORE INTO person_relations (id, person_id, related_person_id, relation_type, description, start_year, end_year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, person_id, related_person_id, relation_type, description || null, start_year || null, end_year || null);
    
    return res.json({ success: true, message: '关系添加成功', data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 批量导入人物
router.post('/batch', (req, res) => {
  try {
    const { people } = req.body;
    if (!Array.isArray(people) || people.length === 0) {
      return res.status(400).json({ success: false, message: '人物数据为空' });
    }
    
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO people (id, name, name_en, birth_year, death_year, region, role, dynasty, level_contents, related_events, image_url)
      VALUES (@id, @name, @name_en, @birth_year, @death_year, @region, @role, @dynasty, @level_contents, @related_events, @image_url)
    `);
    
    let count = 0;
    const insertMany = db.transaction((items) => {
      for (const p of items) {
        insertStmt.run({
          id: p.id || `person_${Date.now()}_${count}`,
          name: p.name,
          name_en: p.name_en || null,
          birth_year: p.birth_year || null,
          death_year: p.death_year || null,
          region: p.region || null,
          role: p.role || null,
          dynasty: p.dynasty || null,
          level_contents: JSON.stringify(p.level_contents || {}),
          related_events: JSON.stringify(p.related_events || []),
          image_url: p.image_url || null,
        });
        count++;
      }
    });
    
    insertMany(people);
    
    return res.json({ success: true, message: `成功导入 ${count} 个人物`, data: { count } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 批量导入人物关系
router.post('/relations/batch', (req, res) => {
  try {
    const { relations } = req.body;
    if (!Array.isArray(relations) || relations.length === 0) {
      return res.status(400).json({ success: false, message: '关系数据为空' });
    }
    
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO person_relations (id, person_id, related_person_id, relation_type, description, start_year, end_year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    let count = 0;
    const insertMany = db.transaction((items) => {
      for (const r of items) {
        insertStmt.run(
          uuidv4(),
          r.person_id,
          r.related_person_id,
          r.relation_type,
          r.description || null,
          r.start_year || null,
          r.end_year || null
        );
        count++;
      }
    });
    
    insertMany(relations);
    
    return res.json({ success: true, message: `成功导入 ${count} 条关系`, data: { count } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
