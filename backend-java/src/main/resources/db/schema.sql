-- ============================================
-- 世界历史学习平台 - 数据库初始化脚本
-- 数据库：SQLite
-- 与 Node.js 版数据库结构完全一致
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    default_level TEXT DEFAULT 'junior',
    storage_mode TEXT DEFAULT 'local',
    theme TEXT DEFAULT 'light',
    font_size TEXT DEFAULT 'medium',
    created_at TEXT,
    updated_at TEXT,
    last_sync_at TEXT
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    status TEXT DEFAULT 'reading',
    level TEXT,
    time_spent INTEGER DEFAULT 0,
    first_read_at TEXT,
    completed_at TEXT,
    UNIQUE(user_id, content_type, content_id)
);

-- 笔记表
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_type TEXT,
    content_id TEXT,
    title TEXT,
    content TEXT,
    tags TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted INTEGER DEFAULT 0
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at TEXT,
    UNIQUE(user_id, content_type, content_id)
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
    created_at TEXT
);

-- 错题本表
CREATE TABLE IF NOT EXISTS wrong_questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    mastered INTEGER DEFAULT 0,
    created_at TEXT
);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    unlocked_at TEXT,
    UNIQUE(user_id, badge_id)
);

-- 学习时长表
CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    duration INTEGER,
    content_type TEXT,
    content_id TEXT,
    session_type TEXT
);

-- 每日统计表
CREATE TABLE IF NOT EXISTS daily_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stat_date TEXT,
    study_duration INTEGER DEFAULT 0,
    events_read INTEGER DEFAULT 0,
    quizzes_taken INTEGER DEFAULT 0,
    UNIQUE(user_id, stat_date)
);

-- 历史事件表
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    era TEXT,
    region TEXT,
    start_year INTEGER,
    end_year INTEGER,
    location TEXT,
    content TEXT,
    key_figure_ids TEXT,
    related_event_ids TEXT
);

-- 历史人物表
CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dynasty TEXT,
    region TEXT,
    role TEXT,
    birth_year TEXT,
    death_year TEXT,
    level_contents TEXT
);

-- 人物关系表
CREATE TABLE IF NOT EXISTS person_relations (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL,
    related_person_id TEXT NOT NULL,
    relation_type TEXT,
    description TEXT,
    start_year TEXT,
    end_year TEXT
);

-- 测验题库表
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    level TEXT,
    era TEXT,
    question TEXT NOT NULL,
    options TEXT,
    answer INTEGER,
    explanation TEXT
);

-- 同步日志表
CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    action TEXT,
    timestamp TEXT
);

-- 徽章定义表
CREATE TABLE IF NOT EXISTS badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    condition TEXT,
    icon TEXT
);

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT
);

-- ============================================
-- 初始化默认徽章
-- ============================================
INSERT OR IGNORE INTO badge_definitions (id, name, description, category, icon) VALUES
('first_event', '初出茅庐', '完成第一个历史事件学习', 'learning', '🎯'),
('events_10', '博览群书', '完成10个历史事件学习', 'learning', '📚'),
('events_25', '史学达人', '完成25个历史事件学习', 'learning', '🏆'),
('first_quiz', '小试牛刀', '完成第一次测验', 'quiz', '📝'),
('quiz_perfect', '满分学霸', '测验获得满分', 'quiz', '💯'),
('first_note', '勤学好记', '创建第一篇学习笔记', 'note', '✏️'),
('notes_10', '笔记达人', '创建10篇学习笔记', 'note', '📒'),
('streak_7', '持之以恒', '连续学习7天', 'streak', '🔥'),
('streak_30', '历史学者', '连续学习30天', 'streak', '👑'),
('first_favorite', '收藏家', '收藏第一个内容', 'favorite', '⭐'),
('people_10', '知人论世', '了解10位历史人物', 'people', '👤'),
('all_eras', '通古博今', '学习所有时代的事件', 'special', '🌍');
