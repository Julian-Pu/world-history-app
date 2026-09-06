/**
 * 批量导入历史事件数据到数据库
 * 用法: node utils/importAllEvents.js
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'history.db');
const db = new Database(dbPath);

const dataDirs = [
  path.join(__dirname, '..', 'data', 'china'),
  path.join(__dirname, '..', 'data', 'world'),
];

let totalImported = 0;
let totalSkipped = 0;

// 准备插入语句
const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO events 
  (id, title, title_en, start_date, end_date, location, region, period, category, level_contents, related_people, related_events, tags, created_at, updated_at)
  VALUES (@id, @title, @title_en, @start_date, @end_date, @location, @region, @period, @category, @level_contents, @related_people, @related_events, @tags, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

// 生成ID（从标题生成拼音/英文ID）
function generateId(title) {
  // 简单的ID生成：使用标题的哈希
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'event_' + Math.abs(hash).toString(36);
}

function importFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const events = JSON.parse(content);
    
    if (!Array.isArray(events)) {
      console.log(`  跳过（不是数组）: ${filePath}`);
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const event of events) {
      if (!event.title || !event.start_date) {
        skipped++;
        continue;
      }

      // 检查是否已存在（按标题）
      const existing = db.prepare('SELECT id FROM events WHERE title = ?').get(event.title);
      if (existing) {
        skipped++;
        continue;
      }

      const eventData = {
        id: event.id || generateId(event.title),
        title: event.title,
        title_en: event.title_en || null,
        start_date: event.start_date,
        end_date: event.end_date || null,
        location: event.location || null,
        region: event.region || 'asia',
        period: event.period || 'ancient',
        category: event.category || null,
        level_contents: JSON.stringify(event.level_contents || {}),
        related_people: JSON.stringify(event.related_people || []),
        related_events: JSON.stringify(event.related_events || []),
        tags: JSON.stringify(event.tags || []),
      };

      insertStmt.run(eventData);
      imported++;
    }

    console.log(`  ${path.basename(filePath)}: 导入 ${imported} 个, 跳过 ${skipped} 个`);
    totalImported += imported;
    totalSkipped += skipped;
  } catch (error) {
    console.error(`  导入失败 ${filePath}:`, error.message);
  }
}

console.log('===== 开始批量导入历史事件 =====\n');

for (const dir of dataDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`目录不存在: ${dir}`);
    continue;
  }
  
  console.log(`目录: ${dir}`);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  
  for (const file of files) {
    importFile(path.join(dir, file));
  }
  console.log('');
}

// 统计
const total = db.prepare('SELECT COUNT(*) as c FROM events').get().c;
const byRegion = db.prepare('SELECT region, COUNT(*) as c FROM events GROUP BY region').all();
const byPeriod = db.prepare('SELECT period, COUNT(*) as c FROM events GROUP BY period').all();

console.log('===== 导入完成 =====');
console.log(`本次导入: ${totalImported} 个`);
console.log(`本次跳过: ${totalSkipped} 个`);
console.log(`数据库总事件数: ${total}`);
console.log(`按地区:`, JSON.stringify(byRegion));
console.log(`按时期:`, JSON.stringify(byPeriod));

db.close();
