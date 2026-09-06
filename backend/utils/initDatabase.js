/**
 * 数据库初始化脚本
 * 运行方式：node utils/initDatabase.js
 * 功能：创建所有数据表（如果config/database.js已自动创建，此脚本可用于重置数据库）
 */
require('dotenv').config();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  世界历史学习应用 - 数据库初始化');
console.log('========================================\n');

// 检查表是否创建成功
const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
`).all();

console.log(`已创建 ${tables.length} 张数据表：`);
tables.forEach(t => console.log(`  - ${t.name}`));

// 创建默认管理员账户（可选）
const bcrypt = require('bcryptjs');
const { generateId } = require('./helpers');

const adminEmail = 'admin@history.com';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const adminId = generateId();
  const passwordHash = bcrypt.hashSync('admin123456', 12);
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, default_level, storage_mode)
    VALUES (?, 'admin', ?, ?, 'high', 'cloud')
  `).run(adminId, adminEmail, passwordHash);
  console.log('\n已创建默认管理员账户：');
  console.log('  邮箱：admin@history.com');
  console.log('  密码：admin123456');
  console.log('  ⚠️  请及时修改默认密码！');
} else {
  console.log('\n管理员账户已存在，跳过创建。');
}

console.log('\n========================================');
console.log('  数据库初始化完成！');
console.log('========================================');
console.log('\n下一步：');
console.log('  1. 运行 npm install 安装依赖');
console.log('  2. 运行 node utils/importData.js 导入历史数据');
console.log('  3. 运行 npm start 启动服务');
