const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'history.db');

// 确保数据目录存在
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// 启用 WAL 模式提高并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化数据表
function initTables() {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      default_level TEXT DEFAULT 'middle',
      storage_mode TEXT DEFAULT 'cloud',
      theme TEXT DEFAULT 'light',
      font_size TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync_at DATETIME
    );

    -- 历史事件表
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_en TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      location TEXT,
      region TEXT NOT NULL,
      period TEXT NOT NULL,
      category TEXT,
      level_contents TEXT NOT NULL DEFAULT '{}',
      related_people TEXT DEFAULT '[]',
      related_events TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 历史人物表
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT,
      birth_year TEXT,
      death_year TEXT,
      region TEXT,
      role TEXT,
      dynasty TEXT,
      level_contents TEXT NOT NULL DEFAULT '{}',
      related_events TEXT DEFAULT '[]',
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 人物关系表
    CREATE TABLE IF NOT EXISTS person_relations (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      related_person_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      description TEXT,
      start_year TEXT,
      end_year TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, related_person_id, relation_type)
    );

    -- 测验题库表
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'choice',
      options TEXT DEFAULT '[]',
      correct_answer TEXT NOT NULL,
      analysis TEXT,
      level TEXT NOT NULL,
      period TEXT,
      region TEXT,
      category TEXT,
      related_event_id TEXT,
      difficulty INTEGER DEFAULT 2,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 学习进度表
    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      status TEXT DEFAULT 'unread',
      level TEXT,
      last_position INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      first_read_at DATETIME,
      last_read_at DATETIME,
      completed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_type, content_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 测验记录表
    CREATE TABLE IF NOT EXISTS quiz_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quiz_type TEXT,
      level TEXT,
      total_questions INTEGER,
      correct_count INTEGER,
      score INTEGER,
      time_spent INTEGER,
      answers TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 错题本表
    CREATE TABLE IF NOT EXISTS wrong_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      user_answer TEXT,
      wrong_count INTEGER DEFAULT 1,
      last_wrong_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mastered INTEGER DEFAULT 0,
      UNIQUE(user_id, quiz_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    -- 笔记表
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_type TEXT,
      content_id TEXT,
      title TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 收藏表
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_type, content_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 成就表
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 学习时长记录表
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      content_type TEXT,
      content_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 每日学习统计表
    CREATE TABLE IF NOT EXISTS daily_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      study_duration INTEGER DEFAULT 0,
      events_read INTEGER DEFAULT 0,
      quizzes_taken INTEGER DEFAULT 0,
      quizzes_correct INTEGER DEFAULT 0,
      notes_created INTEGER DEFAULT 0,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 同步操作日志表（用于增量同步）
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_events_period ON events(period);
    CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);
    CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
    CREATE INDEX IF NOT EXISTS idx_quizzes_level ON quizzes(level);
    CREATE INDEX IF NOT EXISTS idx_quizzes_period ON quizzes(period);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_sync_log_user ON sync_log(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, start_time);
    CREATE INDEX IF NOT EXISTS idx_daily_stats_user ON daily_stats(user_id, date);
  `);
}

initTables();

module.exports = db;
