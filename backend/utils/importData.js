/**
 * 历史数据导入脚本
 * 运行方式：node utils/importData.js
 * 功能：从 data/ 目录下的 JSON 文件导入事件、人物、题目数据
 */
require('dotenv').config();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { generateId } = require('./helpers');

console.log('========================================');
console.log('  世界历史学习应用 - 数据导入');
console.log('========================================\n');

const dataDir = path.join(__dirname, '..', 'data');

// 统计
let stats = {
  events: { inserted: 0, updated: 0, skipped: 0, errors: [] },
  people: { inserted: 0, updated: 0, skipped: 0, errors: [] },
  quizzes: { inserted: 0, updated: 0, skipped: 0, errors: [] },
};

// 导入事件
function importEvents() {
  console.log('📚 正在导入历史事件...');
  const files = [];

  // 扫描所有事件JSON文件
  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (item.name.endsWith('.json') && item.name.includes('event')) {
        files.push(fullPath);
      }
    });
  };

  scanDir(dataDir);

  if (files.length === 0) {
    console.log('  未找到事件数据文件，跳过。');
    return;
  }

  console.log(`  找到 ${files.length} 个事件数据文件`);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO events (id, title, title_en, start_date, end_date, location, region, period, category, level_contents, related_people, related_events, tags, image_url)
    VALUES (@id, @title, @title_en, @start_date, @end_date, @location, @region, @period, @category, @level_contents, @related_people, @related_events, @tags, @image_url)
  `);

  const tx = db.transaction(() => {
    files.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const events = Array.isArray(content) ? content : content.events || [];

        events.forEach(event => {
          if (!event.title || !event.start_date) {
            stats.events.skipped++;
            return;
          }

          const existing = db.prepare('SELECT id FROM events WHERE title = ? AND start_date = ?').get(event.title, event.start_date);

          const eventData = {
            id: existing ? existing.id : event.id || generateId(),
            title: event.title,
            title_en: event.title_en || null,
            start_date: event.start_date,
            end_date: event.end_date || null,
            location: event.location || null,
            region: event.region || 'global',
            period: event.period || 'ancient',
            category: event.category || null,
            level_contents: JSON.stringify(event.level_contents || {}),
            related_people: JSON.stringify(event.related_people || []),
            related_events: JSON.stringify(event.related_events || []),
            tags: JSON.stringify(event.tags || []),
            image_url: event.image_url || null,
          };

          insertStmt.run(eventData);
          if (existing) {
            stats.events.updated++;
          } else {
            stats.events.inserted++;
          }
        });
      } catch (error) {
        stats.events.errors.push({ file, error: error.message });
      }
    });
  });

  tx();
  console.log(`  事件导入完成：新增 ${stats.events.inserted}，更新 ${stats.events.updated}，跳过 ${stats.events.skipped}`);
  if (stats.events.errors.length > 0) {
    console.log(`  ⚠️  ${stats.events.errors.length} 个文件导入失败`);
    stats.events.errors.forEach(e => console.log(`    - ${e.file}: ${e.error}`));
  }
}

// 导入人物
function importPeople() {
  console.log('\n👤 正在导入历史人物...');
  const peopleDir = path.join(dataDir, 'people');
  if (!fs.existsSync(peopleDir)) {
    console.log('  未找到人物数据目录，跳过。');
    return;
  }

  const files = fs.readdirSync(peopleDir).filter(f => f.endsWith('.json'));
  console.log(`  找到 ${files.length} 个人物数据文件`);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO people (id, name, name_en, birth_year, death_year, region, role, dynasty, level_contents, related_events, image_url)
    VALUES (@id, @name, @name_en, @birth_year, @death_year, @region, @role, @dynasty, @level_contents, @related_events, @image_url)
  `);

  const tx = db.transaction(() => {
    files.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(peopleDir, file), 'utf8'));
        const people = Array.isArray(content) ? content : content.people || [];

        people.forEach(person => {
          if (!person.name) {
            stats.people.skipped++;
            return;
          }

          const existing = db.prepare('SELECT id FROM people WHERE name = ?').get(person.name);

          const personData = {
            id: existing ? existing.id : person.id || generateId(),
            name: person.name,
            name_en: person.name_en || null,
            birth_year: person.birth_year || null,
            death_year: person.death_year || null,
            region: person.region || null,
            role: person.role || null,
            dynasty: person.dynasty || null,
            level_contents: JSON.stringify(person.level_contents || {}),
            related_events: JSON.stringify(person.related_events || []),
            image_url: person.image_url || null,
          };

          insertStmt.run(personData);
          if (existing) stats.people.updated++;
          else stats.people.inserted++;
        });
      } catch (error) {
        stats.people.errors.push({ file, error: error.message });
      }
    });
  });

  tx();
  console.log(`  人物导入完成：新增 ${stats.people.inserted}，更新 ${stats.people.updated}，跳过 ${stats.people.skipped}`);
}

// 导入题目
function importQuizzes() {
  console.log('\n❓ 正在导入测验题目...');
  const quizzesDir = path.join(dataDir, 'quizzes');
  if (!fs.existsSync(quizzesDir)) {
    console.log('  未找到题目数据目录，跳过。');
    return;
  }

  const files = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
  console.log(`  找到 ${files.length} 个题目数据文件`);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO quizzes (id, question, type, options, correct_answer, analysis, level, period, region, category, related_event_id, difficulty)
    VALUES (@id, @question, @type, @options, @correct_answer, @analysis, @level, @period, @region, @category, @related_event_id, @difficulty)
  `);

  const tx = db.transaction(() => {
    files.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(quizzesDir, file), 'utf8'));
        const quizzes = Array.isArray(content) ? content : content.quizzes || [];

        quizzes.forEach(quiz => {
          if (!quiz.question || !quiz.correct_answer) {
            stats.quizzes.skipped++;
            return;
          }

          const existing = db.prepare('SELECT id FROM quizzes WHERE question = ?').get(quiz.question);

          const quizData = {
            id: existing ? existing.id : quiz.id || generateId(),
            question: quiz.question,
            type: quiz.type || 'choice',
            options: JSON.stringify(quiz.options || []),
            correct_answer: quiz.correct_answer,
            analysis: quiz.analysis || null,
            level: quiz.level || 'middle',
            period: quiz.period || null,
            region: quiz.region || null,
            category: quiz.category || null,
            related_event_id: quiz.related_event_id || null,
            difficulty: quiz.difficulty || 2,
          };

          insertStmt.run(quizData);
          if (existing) stats.quizzes.updated++;
          else stats.quizzes.inserted++;
        });
      } catch (error) {
        stats.quizzes.errors.push({ file, error: error.message });
      }
    });
  });

  tx();
  console.log(`  题目导入完成：新增 ${stats.quizzes.inserted}，更新 ${stats.quizzes.updated}，跳过 ${stats.quizzes.skipped}`);
}

// 执行导入
importEvents();
importPeople();
importQuizzes();

// 汇总
console.log('\n========================================');
console.log('  数据导入汇总');
console.log('========================================');
console.log(`  历史事件：新增 ${stats.events.inserted}，更新 ${stats.events.updated}`);
console.log(`  历史人物：新增 ${stats.people.inserted}，更新 ${stats.people.updated}`);
console.log(`  测验题目：新增 ${stats.quizzes.inserted}，更新 ${stats.quizzes.updated}`);

const totalErrors = stats.events.errors.length + stats.people.errors.length + stats.quizzes.errors.length;
if (totalErrors > 0) {
  console.log(`\n  ⚠️  共 ${totalErrors} 个错误，请检查上方日志`);
} else {
  console.log('\n  ✅ 全部导入成功！');
}

// 显示数据库统计
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
const peopleCount = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
const quizCount = db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count;

console.log('\n  当前数据库内容统计：');
console.log(`    历史事件：${eventCount} 条`);
console.log(`    历史人物：${peopleCount} 条`);
console.log(`    测验题目：${quizCount} 道`);
console.log('========================================');
