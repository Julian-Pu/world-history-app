# 世界历史学习应用 - 后端服务

## 项目简介

本项目是「世界历史学习应用」的后端服务，提供用户认证、内容管理、学习进度追踪、数据云端同步等完整后端能力。采用 Node.js + Express + SQLite 技术栈，支持快速部署和本地运行。

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 运行时 | Node.js >= 16 | JavaScript 服务端运行环境 |
| Web框架 | Express 4.x | 轻量级 HTTP 服务框架 |
| 数据库 | SQLite (better-sqlite3) | 嵌入式关系型数据库，零配置 |
| 认证 | JWT (jsonwebtoken) | 无状态用户认证 |
| 密码加密 | bcryptjs | 用户密码安全存储 |
| 安全 | helmet + cors + rate-limit | 安全头、跨域、速率限制 |
| 配置 | dotenv | 环境变量管理 |

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并根据需要修改：

```bash
cp .env.example .env
```

关键配置项：
- `PORT`：服务端口，默认 3000
- `JWT_SECRET`：JWT 密钥，**生产环境必须修改为随机字符串**
- `DB_PATH`：数据库文件路径
- `CLIENT_URL`：前端地址，用于 CORS 白名单

### 3. 初始化数据库

```bash
npm run init-db
```

此命令会创建所有数据表，并创建默认管理员账户：
- 邮箱：`admin@history.com`
- 密码：`admin123456`
- ⚠️ 请及时修改默认密码！

### 4. 导入历史数据

```bash
npm run import-data
```

此命令会从 `data/` 目录下的 JSON 文件导入历史事件、人物和测验题目。

### 5. 启动服务

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务启动后，访问 `http://localhost:3000/api/health` 验证服务是否正常。

## API 接口文档

### 基础信息

- Base URL：`http://localhost:3000/api`
- 认证方式：除注册、登录、内容查询外，所有接口需要在请求头携带 `Authorization: Bearer <token>`
- 响应格式：统一为 `{ success: boolean, message: string, data: any, timestamp: string }`

### 认证模块 `/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 用户注册 | 否 |
| POST | `/auth/login` | 用户登录 | 否 |
| POST | `/auth/refresh` | 刷新令牌 | 否 |
| GET | `/auth/me` | 获取当前用户信息 | 是 |
| PUT | `/auth/me` | 更新用户信息 | 是 |
| PUT | `/auth/password` | 修改密码 | 是 |
| PUT | `/auth/storage-mode` | 切换存储模式 | 是 |
| DELETE | `/auth/account` | 注销账号 | 是 |

### 历史事件 `/events`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/events` | 获取事件列表（支持筛选、搜索、分页） | 可选 |
| GET | `/events/:id` | 获取事件详情 | 可选 |
| GET | `/events/timeline/data` | 获取时间线数据 | 可选 |
| GET | `/events/stats/by-period` | 按时期统计事件数 | 否 |

### 历史人物 `/people`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/people` | 获取人物列表 | 可选 |
| GET | `/people/:id` | 获取人物详情 | 可选 |

### 测验 `/quizzes`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/quizzes` | 获取题目列表 | 可选 |
| GET | `/quizzes/random` | 随机组卷 | 可选 |
| POST | `/quizzes/submit` | 提交测验结果 | 是 |
| GET | `/quizzes/records` | 获取测验历史记录 | 是 |
| GET | `/quizzes/wrong-questions` | 获取错题本 | 是 |
| PUT | `/quizzes/wrong-questions/:id/master` | 标记错题已掌握 | 是 |

### 笔记 `/notes`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/notes` | 获取笔记列表 | 是 |
| GET | `/notes/:id` | 获取单条笔记 | 是 |
| POST | `/notes` | 创建笔记 | 是 |
| PUT | `/notes/:id` | 更新笔记 | 是 |
| DELETE | `/notes/:id` | 删除笔记（软删除） | 是 |

### 学习进度 `/progress`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/progress` | 获取学习进度列表 | 是 |
| POST | `/progress/update` | 更新学习进度 | 是 |
| GET | `/progress/by-period` | 按时期统计进度 | 是 |

### 数据同步 `/sync`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/sync/status` | 获取同步状态 | 是 |
| POST | `/sync/push` | 推送本地变更到云端（增量） | 是 |
| POST | `/sync/pull` | 从云端拉取变更（增量） | 是 |
| POST | `/sync/full` | 全量同步 | 是 |
| GET | `/sync/export` | 导出用户所有数据 | 是 |

### 收藏 `/favorites`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/favorites` | 获取收藏列表 | 是 |
| POST | `/favorites` | 添加收藏 | 是 |
| DELETE | `/favorites/:id` | 取消收藏 | 是 |
| DELETE | `/favorites/by-content/:type/:id` | 按内容取消收藏 | 是 |

### 成就 `/achievements`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/achievements` | 获取所有徽章及解锁状态 | 是 |
| GET | `/achievements/recent` | 获取最近解锁的成就 | 是 |

### 学习时长 `/study-sessions`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/study-sessions/start` | 开始学习计时 | 是 |
| POST | `/study-sessions/:id/end` | 结束学习计时 | 是 |
| POST | `/study-sessions/:id/heartbeat` | 心跳保活 | 是 |
| GET | `/study-sessions` | 获取学习会话历史 | 是 |
| GET | `/study-sessions/active/current` | 获取当前活跃会话 | 是 |

### 统计 `/stats`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/stats/overview` | 获取学习总览统计 | 是 |
| GET | `/stats/daily` | 获取每日学习统计 | 是 |
| GET | `/stats/by-period` | 按时期统计进度 | 是 |
| GET | `/stats/by-region` | 按地区统计进度 | 是 |
| GET | `/stats/quiz-trend` | 测验成绩趋势 | 是 |
| GET | `/stats/heatmap` | 学习热力图数据 | 是 |

## 数据同步机制

### 增量同步流程

1. **推送 (Push)**：前端将本地变更（增删改操作）批量发送到后端，后端检查冲突后应用变更
2. **拉取 (Pull)**：前端请求自上次同步以来的所有云端变更，应用到本地
3. **冲突处理**：如果服务端有比本地更新的修改，标记为冲突，由用户选择保留哪份

### 同步实体类型

- `progress`：学习进度
- `note`：笔记
- `favorite`：收藏
- `quiz_record`：测验记录
- `wrong_question`：错题
- `achievement`：成就
- `study_session`：学习会话

## 数据库表结构

详见 `config/database.js` 中的建表语句，主要表包括：

- `users`：用户表
- `events`：历史事件表
- `people`：历史人物表
- `quizzes`：测验题库表
- `learning_progress`：学习进度表
- `quiz_records`：测验记录表
- `wrong_questions`：错题本表
- `notes`：笔记表
- `favorites`：收藏表
- `achievements`：成就表
- `study_sessions`：学习时长记录表
- `daily_stats`：每日学习统计表
- `sync_log`：同步操作日志表

## 数据文件格式

### 事件数据 (`data/**/events-*.json`)

```json
[
  {
    "title": "事件名称",
    "title_en": "Event Name",
    "start_date": "-221",
    "end_date": "-206",
    "location": "中国",
    "region": "asia",
    "period": "ancient",
    "category": "政治",
    "level_contents": {
      "kindergarten": { "summary": "...", "content": "..." },
      "primary": { "summary": "...", "content": "..." },
      "middle": { "summary": "...", "content": "...", "background": "...", "process": "...", "impact": "..." },
      "high": { "summary": "...", "content": "...", "background": "...", "process": "...", "impact": "...", "analysis": "...", "sources": "..." }
    },
    "related_people": ["person_id"],
    "related_events": ["event_id"],
    "tags": ["标签1", "标签2"]
  }
]
```

### 人物数据 (`data/people/*.json`)

```json
[
  {
    "name": "姓名",
    "name_en": "Name",
    "birth_year": "-551",
    "death_year": "-479",
    "region": "asia",
    "role": "思想家",
    "dynasty": "春秋",
    "level_contents": {
      "kindergarten": { "content": "..." },
      "primary": { "content": "..." },
      "middle": { "content": "..." },
      "high": { "content": "..." }
    },
    "related_events": ["event_id"]
  }
]
```

### 题目数据 (`data/quizzes/*.json`)

```json
[
  {
    "question": "题目内容",
    "type": "choice",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "correct_answer": "A",
    "analysis": "答案解析",
    "level": "middle",
    "period": "ancient",
    "region": "asia",
    "category": "政治",
    "difficulty": 2
  }
]
```

## 生产部署建议

1. **修改 JWT_SECRET**：使用长随机字符串，例如 `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. **使用 PostgreSQL**：生产环境建议将 SQLite 替换为 PostgreSQL（修改 `config/database.js`）
3. **反向代理**：使用 Nginx 做反向代理，配置 HTTPS
4. **进程管理**：使用 PM2 或 systemd 管理 Node 进程
5. **定期备份**：定期备份数据库文件

## 常见问题

**Q: 如何重置数据库？**
A: 删除 `data/history.db` 文件，然后重新运行 `npm run init-db` 和 `npm run import-data`。

**Q: 如何添加新的历史事件？**
A: 在 `data/` 目录下创建或编辑 JSON 文件，然后运行 `npm run import-data`。

**Q: 前端如何连接后端？**
A: 在前端配置中设置 API 基础地址为 `http://localhost:3000/api`，并在请求头携带 JWT 令牌。

**Q: 支持多少并发用户？**
A: SQLite 适合中小规模应用（数百并发）。如需更高并发，建议迁移到 PostgreSQL。

## 许可证

MIT License
