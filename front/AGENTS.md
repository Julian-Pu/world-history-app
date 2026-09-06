# 世界历史学习应用 - 架构设计文档

## 应用概述
面向全年龄段的世界历史学习平台，支持分级内容（幼儿园/小学/初中/高中）、交互式时间线、历史地图、互动测验、学习笔记、成就系统。双模式存储：本地（localStorage）+ 云端同步。

## 设计规范

### 色彩系统
- 主色调：琥珀金（历史厚重感）`#B8860B` → `hsl(45, 89%, 38%)`
- 强调色：古铜红 `#CD5C5C` → `hsl(0, 56%, 58%)`
- 背景：米黄底色 `#FBF6E9` → `hsl(44, 67%, 95%)`
- 文字：深棕 `#2C1810` → `hsl(18, 47%, 12%)`
- 次级文字：棕灰 `#6B5B4F` → `hsl(24, 15%, 36%)`

### 时期色彩（时间线标记用）
- 古代文明：`#8B4513` 赭石色
- 中世纪：`#4A5568` 靛蓝灰
- 近代早期：`#2F855A` 森林绿
- 工业革命时代：`#B7791F` 琥珀橙
- 现代世界：`#6B46C1` 紫色

### 地区色彩
- 欧洲：`#3B82F6` 蓝
- 亚洲：`#EF4444` 红
- 非洲：`#F59E0B` 金
- 美洲：`#10B981` 绿
- 全球：`#8B5CF6` 紫

### 排版
- 标题：serif 衬线字体（历史感），用 `font-serif`
- 正文：系统 sans-serif，用 `font-sans`
- 层级：text-4xl/2xl/xl/lg/base/sm 六级

### 间距
- 页面内边距：手机 `p-4`，平板 `p-6`，桌面 `p-8`
- 卡片间距：`gap-4`
- 区块间距：`space-y-6`

### 布局
- 最大内容宽度：`max-w-6xl mx-auto`
- 手机端：底部导航栏（fixed bottom-0）
- 桌面端：顶部导航栏（sticky top-0）
- 响应式断点：sm(640) md(768) lg(1024) xl(1280)

## 前端架构

### 状态管理
- zustand store：`client/src/store/useAppStore.ts` — 全局状态（难度、主题、存储模式、用户）
- zustand store：`client/src/store/useLearningStore.ts` — 学习数据（进度、收藏、笔记、测验记录）
- 内容数据：静态 data 文件（`client/src/data/`），纯前端可运行

### 目录结构
```
client/src/
├── data/                    # 内容数据（与代码分离）
│   ├── events.ts            # 37个历史事件（四级难度）
│   ├── figures.ts           # 20位历史人物（四级难度）
│   ├── quizzes.ts           # 题库
│   ├── eras.ts              # 时期定义
│   ├── regions.ts           # 地区定义
│   ├── achievements.ts      # 成就徽章定义
│   └── map-data.ts          # 历史地图文明标注数据
├── types/                   # 前端类型
│   └── history.ts           # 历史内容相关类型
├── store/                   # zustand stores
│   ├── useAppStore.ts       # 应用设置
│   └── useLearningStore.ts  # 学习数据
├── hooks/                   # 自定义hooks
│   ├── useLocalStorage.ts
│   └── useDailyQuiz.ts
├── pages/                   # 页面
│   ├── Home/                # 首页
│   ├── Timeline/            # 时间线
│   ├── EventDetail/         # 事件详情
│   ├── FigureDetail/        # 人物详情
│   ├── HistoryMap/          # 历史地图
│   ├── QuizList/            # 测验列表
│   ├── QuizPlay/            # 答题页
│   ├── QuizResult/          # 结果页
│   ├── WrongBook/           # 错题本
│   ├── Notes/               # 笔记列表
│   ├── NoteEditor/          # 笔记编辑
│   ├── Search/              # 搜索结果
│   ├── Profile/             # 我的页面
│   ├── Settings/            # 设置
│   ├── Auth/                # 登录注册
│   └── Welcome/             # 欢迎引导
├── components/              # 组件
│   ├── Layout.tsx           # 布局（含导航）
│   ├── Timeline/            # 时间线组件
│   ├── HistoryMap/          # 地图组件
│   ├── DifficultyBadge.tsx  # 难度标签
│   ├── EraBadge.tsx         # 时期标签
│   ├── EventCard.tsx        # 事件卡片
│   └── ProgressRing.tsx     # 进度环
```

## 内容数据结构

### 难度层级
```
type Difficulty = 'kindergarten' | 'elementary' | 'middle' | 'high'
```

### 历史时期
```
type EraId = 'ancient' | 'medieval' | 'early-modern' | 'industrial' | 'modern'
```

### 地区
```
type RegionId = 'europe' | 'asia' | 'africa' | 'americas' | 'global'
```

## 后端架构
- NestJS 模块：`server/modules/history/` — 内容API（可选，内容主要前端静态）
- NestJS 模块：`server/modules/user/` — 用户注册登录
- NestJS 模块：`server/modules/sync/` — 云端数据同步
- 数据库表：users, user_progress, notes, quiz_records, wrong_questions, favorites

## 核心交互规范
- 时间线：横向滚动+缩放，鼠标滚轮/双指捏合缩放，拖拽平移
- 难度切换：全局顶部/详情页顶部切换，实时切换内容深度
- 收藏：⭐图标，点击切换，存在学习数据中
- 已读标记：眼睛图标，访问详情自动标记
- 学习日历：日期热力图样式
- 成就解锁：toast + 动画徽章展示
