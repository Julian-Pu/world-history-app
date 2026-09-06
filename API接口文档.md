# 世界历史学习平台 - API 接口文档

> 本文档详细描述世界历史学习平台后端所有 API 接口的请求参数、响应格式和使用说明。
>
> **基础 URL**：`http://localhost:3000/api`
> **文档版本**：V3.0 | 更新日期：2026-09-06

---

## 目录

1. [通用说明](#一通用说明)
2. [认证模块 Auth](#二认证模块-auth)
3. [历史事件 Events](#三历史事件-events)
4. [历史人物 People](#四历史人物-people)
5. [学习进度 Progress](#五学习进度-progress)
6. [学习笔记 Notes](#六学习笔记-notes)
7. [收藏 Favorites](#七收藏-favorites)
8. [测验 Quizzes](#八测验-quizzes)
9. [成就 Achievements](#九成就-achievements)
10. [学习时长 StudySessions](#十学习时长-studysessions)
11. [统计 Stats](#十一统计-stats)
12. [数据同步 Sync](#十二数据同步-sync)
13. [数据管理 Data](#十三数据管理-data)
14. [健康检查 Health](#十四健康检查-health)

---

## 一、通用说明

### 1.1 基础 URL

```
http://localhost:3000/api
```

### 1.2 统一响应格式

所有接口统一返回以下格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... },
  "timestamp": "2026-09-06T10:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 请求是否成功 |
| message | string | 提示信息 |
| data | object/array | 响应数据（具体格式见各接口） |
| timestamp | string | 服务器时间戳（ISO 8601） |

### 1.3 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "error": "ERROR_CODE",
  "timestamp": "2026-09-06T10:00:00.000Z"
}
```

### 1.4 认证方式

需要认证的接口，请求头中必须携带 JWT Token：

```
Authorization: Bearer <token>
```

Token 通过登录接口获取，有效期 7 天。

### 1.5 认证中间件说明

| 中间件 | 说明 |
|--------|------|
| `authenticate` | 必须登录，未登录返回 401 |
| `optionalAuth` | 可选登录，未登录也可访问（部分数据可能受限） |

### 1.6 通用 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册） |
| 429 | 请求过于频繁（限流） |
| 500 | 服务器内部错误 |

---

## 二、认证模块 Auth

基础路径：`/api/auth`

### 2.1 用户注册

- **路径**：`POST /api/auth/register`
- **认证**：无需
- **说明**：注册新用户

**请求体**：
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "default_level": "junior"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（3-20字符） |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（6-50字符） |
| default_level | string | 否 | 默认难度等级（kindergarten/elementary/junior/senior），默认 junior |

**响应 data**：
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "default_level": "junior",
    "storage_mode": "local",
    "theme": "light",
    "font_size": "medium",
    "created_at": "2026-09-06 10:00:00"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.2 用户登录

- **路径**：`POST /api/auth/login`
- **认证**：无需
- **说明**：用户登录，支持邮箱或用户名登录

**请求体**：
```json
{
  "email": "admin@history.com",
  "password": "admin123456"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱或用户名（后端同时支持 account 和 email 字段） |
| password | string | 是 | 密码 |

**响应 data**：
```json
{
  "user": {
    "id": "cafc10d4-1a6c-4faa-ac9a-f9f70d1cd166",
    "username": "admin",
    "email": "admin@history.com",
    "default_level": "high",
    "storage_mode": "cloud",
    "theme": "light",
    "font_size": "medium",
    "created_at": "2026-09-04 13:38:17",
    "updated_at": "2026-09-04 13:38:17",
    "last_sync_at": "2026-09-05 16:21:21"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.3 刷新 Token

- **路径**：`POST /api/auth/refresh`
- **认证**：需要（refreshToken 中间件）
- **说明**：刷新访问令牌

**请求体**：
```json
{
  "refresh_token": "..."
}
```

### 2.4 获取当前用户信息

- **路径**：`GET /api/auth/me`
- **认证**：需要（authenticate）
- **说明**：获取当前登录用户的详细信息

**响应 data**：同登录接口的 user 对象

### 2.5 更新用户信息

- **路径**：`PUT /api/auth/me`
- **认证**：需要
- **说明**：更新当前用户的基本信息

**请求体**：
```json
{
  "username": "newname",
  "default_level": "senior",
  "theme": "dark",
  "font_size": "large"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 新用户名 |
| default_level | string | 否 | 默认难度等级 |
| theme | string | 否 | 主题（light/dark） |
| font_size | string | 否 | 字号（small/medium/large） |

### 2.6 修改密码

- **路径**：`PUT /api/auth/password`
- **认证**：需要
- **说明**：修改当前用户密码

**请求体**：
```json
{
  "old_password": "oldpass123",
  "new_password": "newpass456"
}
```

### 2.7 更新存储模式

- **路径**：`PUT /api/auth/storage-mode`
- **认证**：需要
- **说明**：更新用户的存储模式（本地/云端）

**请求体**：
```json
{
  "storage_mode": "cloud"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| storage_mode | string | 是 | 存储模式（local/cloud） |

### 2.8 删除账号

- **路径**：`DELETE /api/auth/account`
- **认证**：需要
- **说明**：删除当前用户账号及其所有数据

**请求体**：
```json
{
  "password": "password123"
}
```

---

## 三、历史事件 Events

基础路径：`/api/events`

### 3.1 获取事件列表

- **路径**：`GET /api/events`
- **认证**：可选（optionalAuth）
- **说明**：获取历史事件列表，支持筛选和分页

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| era | string | 否 | 时代筛选（ancient/medieval/modern/contemporary） |
| region | string | 否 | 地区筛选（asia/europe/africa/americas/oceania/world） |
| level | string | 否 | 难度等级（kindergarten/elementary/junior/senior） |
| keyword | string | 否 | 关键词搜索 |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

**响应 data**：
```json
{
  "list": [
    {
      "id": "uuid",
      "title": "事件标题",
      "era": "ancient",
      "region": "asia",
      "start_year": -1046,
      "end_year": -771,
      "location": "地点",
      "summary": "内容摘要",
      "is_read": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 37,
    "total_pages": 2
  }
}
```

### 3.2 获取事件详情

- **路径**：`GET /api/events/:id`
- **认证**：可选
- **说明**：获取单个历史事件的详细信息

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 事件 ID |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | string | 否 | 指定难度等级，不指定则返回所有等级 |

**响应 data**：
```json
{
  "id": "uuid",
  "title": "事件标题",
  "era": "ancient",
  "region": "asia",
  "start_year": -1046,
  "end_year": -771,
  "location": "地点",
  "content": {
    "kindergarten": { "summary": "...", "background": "...", "process": "...", "impact": "..." },
    "elementary": { ... },
    "junior": { ... },
    "senior": { ... }
  },
  "key_figures": [...],
  "related_events": [...],
  "is_read": false,
  "is_favorite": false
}
```

### 3.3 获取时间线数据

- **路径**：`GET /api/events/timeline/data`
- **认证**：可选
- **说明**：获取时间线展示所需的精简数据

**查询参数**：同事件列表

**响应 data**：
```json
[
  {
    "id": "uuid",
    "title": "事件标题",
    "era": "ancient",
    "region": "asia",
    "start_year": -1046,
    "end_year": -771,
    "is_read": false
  }
]
```

### 3.4 按时代统计事件数量

- **路径**：`GET /api/events/stats/by-period`
- **认证**：无需
- **说明**：按时代统计事件数量分布

**响应 data**：
```json
[
  { "era": "ancient", "count": 15 },
  { "era": "medieval", "count": 10 },
  { "era": "modern", "count": 8 },
  { "era": "contemporary", "count": 4 }
]
```

---

## 四、历史人物 People

基础路径：`/api/people`

### 4.1 获取人物列表

- **路径**：`GET /api/people`
- **认证**：无需
- **说明**：获取历史人物列表，支持筛选

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dynasty | string | 否 | 朝代筛选 |
| region | string | 否 | 地区筛选 |
| role | string | 否 | 身份筛选 |
| keyword | string | 否 | 关键词搜索 |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

**响应 data**：
```json
{
  "list": [
    {
      "id": "uuid",
      "name": "人物姓名",
      "dynasty": "朝代",
      "region": "地区",
      "role": "身份",
      "birth_year": "生卒年",
      "death_year": ""
    }
  ],
  "pagination": { ... }
}
```

### 4.2 获取人物详情

- **路径**：`GET /api/people/:id`
- **认证**：无需
- **说明**：获取单个历史人物的详细信息

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 人物 ID |

**响应 data**：
```json
{
  "id": "uuid",
  "name": "人物姓名",
  "dynasty": "朝代",
  "region": "地区",
  "role": "身份",
  "birth_year": "生卒年",
  "death_year": "",
  "level_contents": {
    "kindergarten": { "summary": "..." },
    "elementary": { "summary": "..." },
    "junior": { "summary": "..." },
    "senior": { "summary": "..." }
  },
  "relations": [
    {
      "related_person_id": "uuid",
      "related_person_name": "相关人物",
      "relation_type": "君臣",
      "description": "关系描述"
    }
  ],
  "related_events": [...]
}
```

### 4.3 获取人物关系网络图谱

- **路径**：`GET /api/people/network/graph`
- **认证**：无需
- **说明**：获取人物关系网络图谱数据（ECharts 力导向图格式）

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dynasty | string | 否 | 朝代筛选，不指定则返回全部 |
| min_relations | number | 否 | 最小关系数，过滤孤立节点，默认 0 |

**响应 data**：
```json
{
  "nodes": [
    {
      "id": "uuid",
      "name": "人物姓名",
      "dynasty": "朝代",
      "category": 0,
      "symbolSize": 40,
      "value": 5
    }
  ],
  "links": [
    {
      "source": "人物ID1",
      "target": "人物ID2",
      "relation_type": "君臣",
      "description": "关系描述",
      "lineStyle": { "color": "#xxx" }
    }
  ],
  "categories": [
    { "name": "先秦" },
    { "name": "秦汉" }
  ]
}
```

### 4.4 添加人物关系

- **路径**：`POST /api/people/relations`
- **认证**：无需（管理接口）
- **说明**：添加单条人物关系

**请求体**：
```json
{
  "person_id": "人物ID1",
  "related_person_id": "人物ID2",
  "relation_type": "君臣",
  "description": "关系描述",
  "start_year": "",
  "end_year": ""
}
```

### 4.5 批量导入人物

- **路径**：`POST /api/people/batch`
- **认证**：无需（管理接口）
- **说明**：批量导入历史人物数据

**请求体**：
```json
{
  "people": [
    {
      "id": "uuid-or-custom",
      "name": "人物姓名",
      "dynasty": "朝代",
      "region": "地区",
      "role": "身份",
      "birth_year": "",
      "death_year": "",
      "level_contents": { ... }
    }
  ]
}
```

### 4.6 批量导入人物关系

- **路径**：`POST /api/people/relations/batch`
- **认证**：无需（管理接口）
- **说明**：批量导入人物关系数据

**请求体**：
```json
{
  "relations": [
    {
      "person_id": "人物ID1",
      "related_person_id": "人物ID2",
      "relation_type": "君臣",
      "description": "关系描述"
    }
  ]
}
```

---

## 五、学习进度 Progress

基础路径：`/api/progress`

### 5.1 获取学习进度列表

- **路径**：`GET /api/progress`
- **认证**：需要
- **说明**：获取当前用户的所有学习进度记录

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content_type | string | 否 | 内容类型（event/person） |
| status | string | 否 | 状态（reading/completed） |

**响应 data**：
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "content_type": "event",
    "content_id": "uuid",
    "status": "completed",
    "level": "junior",
    "time_spent": 120,
    "first_read_at": "2026-09-06 10:00:00",
    "completed_at": "2026-09-06 10:05:00"
  }
]
```

### 5.2 更新学习进度

- **路径**：`POST /api/progress/update`
- **认证**：需要
- **说明**：更新或创建学习进度记录（标记已读/在读）

**请求体**：
```json
{
  "content_type": "event",
  "content_id": "uuid",
  "status": "completed",
  "level": "junior",
  "time_spent": 120
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content_type | string | 是 | 内容类型（event/person） |
| content_id | string | 是 | 内容 ID |
| status | string | 是 | 状态（reading/completed） |
| level | string | 否 | 难度等级 |
| time_spent | number | 否 | 花费时间（秒） |

**响应 data**：
```json
{
  "id": "uuid",
  "content_type": "event",
  "content_id": "uuid",
  "status": "completed",
  "created": false
}
```

> `created` 字段表示是否为新创建的记录（true=新建，false=更新）

### 5.3 按时代统计学习进度

- **路径**：`GET /api/progress/by-period`
- **认证**：需要
- **说明**：按时代统计已完成的学习进度数量

**响应 data**：
```json
[
  { "era": "ancient", "completed": 10, "total": 15 },
  { "era": "medieval", "completed": 5, "total": 10 }
]
```

---

## 六、学习笔记 Notes

基础路径：`/api/notes`

### 6.1 获取笔记列表

- **路径**：`GET /api/notes`
- **认证**：需要
- **说明**：获取当前用户的所有笔记

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content_type | string | 否 | 关联内容类型（event/person） |
| content_id | string | 否 | 关联内容 ID |
| keyword | string | 否 | 关键词搜索 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应 data**：
```json
{
  "list": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "content_type": "event",
      "content_id": "uuid",
      "title": "笔记标题",
      "content": "笔记内容（HTML）",
      "tags": ["标签1", "标签2"],
      "created_at": "2026-09-06 10:00:00",
      "updated_at": "2026-09-06 10:30:00"
    }
  ],
  "pagination": { ... }
}
```

### 6.2 获取单条笔记

- **路径**：`GET /api/notes/:id`
- **认证**：需要
- **说明**：获取单条笔记详情

### 6.3 创建笔记

- **路径**：`POST /api/notes`
- **认证**：需要
- **说明**：创建新笔记

**请求体**：
```json
{
  "content_type": "event",
  "content_id": "uuid",
  "title": "笔记标题",
  "content": "笔记内容（HTML）",
  "tags": ["标签1"]
}
```

### 6.4 更新笔记

- **路径**：`PUT /api/notes/:id`
- **认证**：需要
- **说明**：更新已有笔记

**请求体**：同创建笔记（所有字段可选）

### 6.5 删除笔记

- **路径**：`DELETE /api/notes/:id`
- **认证**：需要
- **说明**：删除笔记（软删除，设置 deleted=1）

---

## 七、收藏 Favorites

基础路径：`/api/favorites`

### 7.1 获取收藏列表

- **路径**：`GET /api/favorites`
- **认证**：需要
- **说明**：获取当前用户的所有收藏

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content_type | string | 否 | 内容类型（event/person） |

**响应 data**：
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "content_type": "event",
    "content_id": "uuid",
    "content_title": "内容标题",
    "created_at": "2026-09-06 10:00:00"
  }
]
```

### 7.2 添加收藏

- **路径**：`POST /api/favorites`
- **认证**：需要
- **说明**：添加收藏

**请求体**：
```json
{
  "content_type": "event",
  "content_id": "uuid"
}
```

### 7.3 删除收藏（按ID）

- **路径**：`DELETE /api/favorites/:id`
- **认证**：需要
- **说明**：按收藏记录 ID 删除

### 7.4 删除收藏（按内容）

- **路径**：`DELETE /api/favorites/by-content/:content_type/:content_id`
- **认证**：需要
- **说明**：按内容类型和内容 ID 删除收藏（取消收藏）

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| content_type | string | 内容类型（event/person） |
| content_id | string | 内容 ID |

---

## 八、测验 Quizzes

基础路径：`/api/quizzes`

### 8.1 获取测验列表

- **路径**：`GET /api/quizzes`
- **认证**：可选
- **说明**：获取测验题目列表

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | string | 否 | 难度等级 |
| era | string | 否 | 时代 |
| limit | number | 否 | 数量，默认 10 |

### 8.2 获取随机测验

- **路径**：`GET /api/quizzes/random`
- **认证**：可选
- **说明**：获取随机测验题目

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | string | 否 | 难度等级 |
| count | number | 否 | 题目数量，默认 10 |

**响应 data**：
```json
[
  {
    "id": "uuid",
    "level": "junior",
    "era": "ancient",
    "question": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": 0,
    "explanation": "答案解析"
  }
]
```

### 8.3 提交测验

- **路径**：`POST /api/quizzes/submit`
- **认证**：需要
- **说明**：提交测验答案，保存记录

**请求体**：
```json
{
  "quiz_type": "random",
  "level": "junior",
  "answers": [
    { "question_id": "uuid", "selected_option": 0 }
  ],
  "time_spent": 120
}
```

**响应 data**：
```json
{
  "record_id": "uuid",
  "total_questions": 10,
  "correct_count": 8,
  "score": 80,
  "wrong_questions": [...]
}
```

### 8.4 获取测验记录

- **路径**：`GET /api/quizzes/records`
- **认证**：需要
- **说明**：获取当前用户的测验记录

### 8.5 获取错题本

- **路径**：`GET /api/quizzes/wrong-questions`
- **认证**：需要
- **说明**：获取当前用户的错题列表

### 8.6 标记错题已掌握

- **路径**：`PUT /api/quizzes/wrong-questions/:id/master`
- **认证**：需要
- **说明**：将错题标记为已掌握（从错题本移除）

---

## 九、成就 Achievements

基础路径：`/api/achievements`

### 9.1 获取成就列表

- **路径**：`GET /api/achievements`
- **认证**：需要
- **说明**：获取当前用户的所有成就（含未解锁）

**响应 data**：
```json
[
  {
    "id": "uuid",
    "badge_id": "first_event",
    "name": "初出茅庐",
    "description": "完成第一个历史事件学习",
    "category": "learning",
    "icon": "🎯",
    "unlocked": true,
    "unlocked_at": "2026-09-06 10:00:00",
    "progress": { "current": 1, "target": 1 }
  }
]
```

### 9.2 获取最近解锁的成就

- **路径**：`GET /api/achievements/recent`
- **认证**：需要
- **说明**：获取最近解锁的成就（用于成就弹窗提示）

**响应 data**：
```json
[
  {
    "badge_id": "first_event",
    "name": "初出茅庐",
    "description": "完成第一个历史事件学习",
    "icon": "🎯",
    "unlocked_at": "2026-09-06 10:00:00"
  }
]
```

---

## 十、学习时长 StudySessions

基础路径：`/api/study-sessions`

### 10.1 开始学习会话

- **路径**：`POST /api/study-sessions/start`
- **认证**：需要
- **说明**：开始一次学习会话，记录开始时间

**请求体**：
```json
{
  "content_type": "event",
  "content_id": "uuid",
  "session_type": "reading"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content_type | string | 否 | 学习内容类型 |
| content_id | string | 否 | 学习内容 ID |
| session_type | string | 否 | 会话类型（reading/quiz/review） |

**响应 data**：
```json
{
  "session_id": "uuid",
  "start_time": "2026-09-06 10:00:00"
}
```

> ⚠️ **重要**：返回字段名是 `session_id`，不是 `id`

### 10.2 结束学习会话

- **路径**：`POST /api/study-sessions/:id/end`
- **认证**：需要
- **说明**：结束学习会话，记录学习时长

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 会话 ID（即 start 接口返回的 session_id） |

**请求体**：
```json
{
  "duration": 300
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| duration | number | 是 | 学习时长（**秒**，不是分钟） |

### 10.3 学习心跳

- **路径**：`POST /api/study-sessions/:id/heartbeat`
- **认证**：需要
- **说明**：学习会话心跳，更新最后活跃时间（防止会话超时）

### 10.4 获取学习会话列表

- **路径**：`GET /api/study-sessions`
- **认证**：需要
- **说明**：获取当前用户的学习会话记录

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 结束日期 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应 data**：
```json
{
  "list": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "start_time": "2026-09-06 10:00:00",
      "end_time": "2026-09-06 10:05:00",
      "duration": 300,
      "content_type": "event",
      "content_id": "uuid",
      "session_type": "reading"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

> ⚠️ **重要**：返回格式是 `{ list, pagination }`，不是直接数组；每条记录的 duration 字段单位是**秒**

### 10.5 获取当前活跃会话

- **路径**：`GET /api/study-sessions/active/current`
- **认证**：需要
- **说明**：获取当前进行中的学习会话（如果有）

---

## 十一、统计 Stats

基础路径：`/api/stats`

### 11.1 获取统计概览

- **路径**：`GET /api/stats/overview`
- **认证**：需要
- **说明**：获取用户学习数据概览

**响应 data**：
```json
{
  "total_study_time": 3600,
  "total_events_read": 15,
  "total_people_read": 8,
  "total_quizzes_taken": 5,
  "average_quiz_score": 80,
  "streak_days": 3,
  "total_notes": 10,
  "total_favorites": 20,
  "unlocked_achievements": 5
}
```

### 11.2 获取每日统计

- **路径**：`GET /api/stats/daily`
- **认证**：需要
- **说明**：获取每日学习统计

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

### 11.3 按时代统计

- **路径**：`GET /api/stats/by-period`
- **认证**：需要
- **说明**：按时代统计学习数据

### 11.4 按地区统计

- **路径**：`GET /api/stats/by-region`
- **认证**：需要
- **说明**：按地区统计学习数据

### 11.5 获取测验趋势

- **路径**：`GET /api/stats/quiz-trend`
- **认证**：需要
- **说明**：获取测验成绩趋势数据

### 11.6 获取学习热力图

- **路径**：`GET /api/stats/heatmap`
- **认证**：需要
- **说明**：获取学习日历热力图数据

**响应 data**：
```json
[
  { "date": "2026-09-01", "study_duration": 1800, "events_read": 3 },
  { "date": "2026-09-02", "study_duration": 3600, "events_read": 5 }
]
```

---

## 十二、数据同步 Sync

基础路径：`/api/sync`

### 12.1 获取同步状态

- **路径**：`GET /api/sync/status`
- **认证**：需要
- **说明**：获取当前用户的同步状态

**响应 data**：
```json
{
  "last_sync_at": "2026-09-06 10:00:00",
  "storage_mode": "cloud",
  "pending_changes": 0
}
```

### 12.2 推送数据到云端

- **路径**：`POST /api/sync/push`
- **认证**：需要
- **说明**：将本地数据推送到云端（全量覆盖或合并）

**请求体**：
```json
{
  "progress": [...],
  "favorites": [...],
  "notes": [...],
  "quiz_records": [...],
  "achievements": [...],
  "study_sessions": [...],
  "daily_stats": [...]
}
```

### 12.3 从云端拉取数据

- **路径**：`POST /api/sync/pull`
- **认证**：需要
- **说明**：从云端拉取所有数据

**响应 data**：同 push 请求体格式

### 12.4 全量同步

- **路径**：`POST /api/sync/full`
- **认证**：需要
- **说明**：执行完整同步（先推送再拉取，合并数据）

**请求体**：同 push

**响应 data**：同 pull

### 12.5 导出学习数据

- **路径**：`GET /api/sync/export`
- **认证**：需要
- **说明**：导出当前用户的所有学习数据为 JSON

**响应**：JSON 文件下载

---

## 十三、数据管理 Data

基础路径：`/api/data`

### 13.1 清除数据

- **路径**：`POST /api/data/clear`
- **认证**：需要
- **说明**：按类型清除用户数据（支持本地/云端选择）

**请求体**：
```json
{
  "scope": "all",
  "types": ["progress", "favorites", "notes", "quizzes", "wrong_questions", "achievements", "study_time"]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scope | string | 是 | 清除范围（local=仅本地，cloud=仅云端，all=全部） |
| types | array | 是 | 要清除的数据类型数组，支持全选 |

**可选数据类型**：
- `progress`：学习进度
- `favorites`：收藏
- `notes`：笔记
- `quizzes`：测验记录
- `wrong_questions`：错题本
- `achievements`：成就徽章
- `study_time`：学习时长

---

## 十四、健康检查 Health

### 14.1 健康检查

- **路径**：`GET /api/health`
- **认证**：无需
- **说明**：检查服务是否正常运行

**响应**：
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-09-06T10:00:00.000Z"
}
```

---

## 附录

### A. 难度等级枚举

| 值 | 名称 | 说明 |
|----|------|------|
| kindergarten | 幼儿园 | 3-6岁，趣味故事 |
| elementary | 小学 | 7-12岁，基础知识 |
| junior | 初中 | 13-15岁，系统知识 |
| senior | 高中 | 16-18岁，深度分析 |

### B. 时代枚举

| 值 | 名称 | 说明 |
|----|------|------|
| ancient | 古代 | 远古至公元5世纪 |
| medieval | 中世纪 | 公元5世纪至15世纪 |
| modern | 近代 | 15世纪至20世纪初 |
| contemporary | 现代 | 20世纪初至今 |

### C. 地区枚举

| 值 | 名称 |
|----|------|
| asia | 亚洲 |
| europe | 欧洲 |
| africa | 非洲 |
| americas | 美洲 |
| oceania | 大洋洲 |
| world | 全球/世界性事件 |

### D. 人物关系类型枚举

君臣、师生、对手、政敌、父子、兄弟、夫妻、祖孙、朋友、盟友、反叛、继承、同学、同时代思想家、其他

### E. 默认管理员账号

| 字段 | 值 |
|------|-----|
| 邮箱 | admin@history.com |
| 密码 | admin123456 |
| 用户ID | cafc10d4-1a6c-4faa-ac9a-f9f70d1cd166 |

---

**文档版本**：V3.0  
**更新日期**：2026-09-06  
**接口总数**：55个（13个路由模块）
