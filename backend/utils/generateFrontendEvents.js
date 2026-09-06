/**
 * 从后端数据库读取事件数据，生成前端 events.ts 文件
 * 用法: node utils/generateFrontendEvents.js
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'history.db');
const db = new Database(dbPath, { readonly: true });

const outputPath = path.join(__dirname, '..', '..', 'front', 'client', 'src', 'data', 'events-generated.ts');

// 从数据库读取所有事件
const events = db.prepare('SELECT * FROM events ORDER BY start_date').all();

console.log(`从数据库读取到 ${events.length} 个事件`);

// 转换为前端格式
function convertToFrontend(event) {
  let levelContents = {};
  try {
    levelContents = JSON.parse(event.level_contents || '{}');
  } catch (e) {
    levelContents = {};
  }

  let relatedPeople = [];
  try {
    relatedPeople = JSON.parse(event.related_people || '[]');
  } catch (e) {}

  let relatedEvents = [];
  try {
    relatedEvents = JSON.parse(event.related_events || '[]');
  } catch (e) {}

  // 年份转换：字符串转数字（处理公元前负数）
  const startYear = parseInt(event.start_date) || 0;
  const endYear = event.end_date ? parseInt(event.end_date) : startYear;

  // 转换难度内容
  function convertLevel(levelData) {
    if (!levelData) return null;
    return {
      summary: levelData.summary || '',
      background: levelData.background || levelData.content || '',
      process: levelData.process || '',
      impact: levelData.impact || '',
      funFacts: levelData.funFacts || [],
      keyFigures: levelData.keyFigures || relatedPeople,
      relatedEventIds: [],
    };
  }

  // 后端用 primary，前端用 elementary
  const elementary = levelContents.primary || levelContents.elementary;

  return {
    id: event.id,
    title: event.title,
    era: event.period || 'ancient',
    region: event.region || 'asia',
    startYear,
    endYear,
    location: event.location || '',
    keyFigureIds: [],
    content: {
      kindergarten: convertLevel(levelContents.kindergarten),
      elementary: convertLevel(elementary),
      middle: convertLevel(levelContents.middle),
      high: convertLevel(levelContents.high),
    },
  };
}

const frontendEvents = events.map(convertToFrontend);

// 生成 TypeScript 文件内容
let content = `// 此文件由 generateFrontendEvents.js 自动生成，请勿手动编辑
// 生成时间: ${new Date().toISOString()}
// 事件总数: ${frontendEvents.length}

import type { HistoryEvent } from '../types/history';

export const EVENTS: HistoryEvent[] = ${JSON.stringify(frontendEvents, null, 2)};
`;

fs.writeFileSync(outputPath, content, 'utf8');
console.log(`已生成: ${outputPath}`);
console.log(`事件总数: ${frontendEvents.length}`);

// 按时期统计
const byEra = {};
frontendEvents.forEach(e => {
  byEra[e.era] = (byEra[e.era] || 0) + 1;
});
console.log('按时期:', JSON.stringify(byEra));

db.close();
