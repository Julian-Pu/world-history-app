/**
 * 批量导入人物和人物关系数据
 * 用法: node utils/importPeopleRelations.js
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 简单的UUID生成函数
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const dbPath = path.join(__dirname, '..', 'data', 'history.db');
const db = new Database(dbPath);

const peopleDir = path.join(__dirname, '..', 'data', 'people');

let totalPeople = 0;
let totalRelations = 0;

// 插入人物
const insertPerson = db.prepare(`
  INSERT OR REPLACE INTO people (id, name, name_en, birth_year, death_year, region, role, dynasty, level_contents, related_events, image_url)
  VALUES (@id, @name, @name_en, @birth_year, @death_year, @region, @role, @dynasty, @level_contents, @related_events, @image_url)
`);

// 插入关系
const insertRelation = db.prepare(`
  INSERT OR IGNORE INTO person_relations (id, person_id, related_person_id, relation_type, description, start_year, end_year)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function importFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // 导入人物
    if (Array.isArray(data.people)) {
      const importMany = db.transaction((people) => {
        for (const p of people) {
          insertPerson.run({
            id: p.id,
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
          totalPeople++;
        }
      });
      importMany(data.people);
    }
    
    // 导入关系
    if (Array.isArray(data.relations)) {
      const importMany = db.transaction((relations) => {
        for (const r of relations) {
          insertRelation.run(
            uuidv4(),
            r.person_id,
            r.related_person_id,
            r.relation_type,
            r.description || null,
            r.start_year || null,
            r.end_year || null
          );
          totalRelations++;
        }
      });
      importMany(data.relations);
    }
    
    console.log(`  ${path.basename(filePath)}: 人物 ${data.people?.length || 0}, 关系 ${data.relations?.length || 0}`);
  } catch (error) {
    console.error(`  导入失败 ${filePath}:`, error.message);
  }
}

console.log('===== 开始导入人物和关系数据 =====\n');

if (fs.existsSync(peopleDir)) {
  const files = fs.readdirSync(peopleDir).filter(f => f.endsWith('.json')).sort();
  for (const file of files) {
    importFile(path.join(peopleDir, file));
  }
} else {
  console.log('人物数据目录不存在');
}

// 统计
const peopleCount = db.prepare('SELECT COUNT(*) as c FROM people').get().c;
const relationCount = db.prepare('SELECT COUNT(*) as c FROM person_relations').get().c;

console.log('\n===== 导入完成 =====');
console.log(`本次导入人物: ${totalPeople}`);
console.log(`本次导入关系: ${totalRelations}`);
console.log(`数据库人物总数: ${peopleCount}`);
console.log(`数据库关系总数: ${relationCount}`);

db.close();
