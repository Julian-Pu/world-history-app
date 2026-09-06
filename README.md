# 世界历史学习平台

> 一个沉浸式、互动式、分级化的世界历史学习平台，支持网页端、手机端、电脑端响应式访问。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![Version](https://img.shields.io/badge/version-V3.0-orange.svg)](更新日志.md)

---

## 🌟 项目简介

世界历史学习平台旨在通过交互式时间线、历史地图、人物关系网络图谱、互动测验等多种形式，让历史学习变得生动有趣。平台支持四级难度分级（幼儿园/小学/初中/高中），适配不同年龄段用户，并提供本地保存与云端同步双模式存储。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 📅 交互式时间线 | 按时间顺序展示历史事件，支持缩放、拖拽、筛选 |
| 📖 事件百科 | 每个事件包含背景、过程、影响，四级难度分级内容 |
| 👤 人物百科 | 历史人物详细介绍，按朝代/地区筛选 |
| 🕸️ 人物关系网络图谱 | ECharts 力导向图展示人物关系，15种关系类型 |
| 🗺️ 历史地图 | 按时代切换地图，展示疆域/政权分布 |
| 📝 互动测验 | 四级难度题库，即时评分和解析，错题本 |
| 📒 学习笔记 | Tiptap 3 富文本编辑器，按事件/人物关联 |
| ⭐ 收藏功能 | 收藏感兴趣的事件和人物 |
| 📊 学习进度追踪 | 已读统计、学习时长自动计时、连续学习天数、热力图 |
| 🏆 成就系统 | 多种成就徽章，激励持续学习 |
| 🔄 双模式存储 | 本地保存/云端同步，用户可自主选择 |
| 🔍 全局搜索 | 事件/人物关键词搜索 |

## 🛠️ 技术栈

### 前端
- **框架**：React 19 + TypeScript
- **构建**：Vite 7
- **样式**：Tailwind CSS 4 + Radix UI
- **状态管理**：Zustand
- **路由**：React Router 6
- **图表**：ECharts 5（人物关系图谱）
- **富文本**：Tiptap 3
- **图标**：Lucide React

### 后端
- **运行时**：Node.js >= 22
- **框架**：Express 4
- **数据库**：SQLite（better-sqlite3）
- **认证**：JWT（jsonwebtoken）+ bcryptjs
- **安全**：helmet + cors + express-rate-limit

## 📁 项目结构

```
world-history-app/
├── 项目文档.html                    # 项目完整文档
├── 前后端集成与部署指南.md           # 通用部署指南
├── 部署与运行实战指南.md             # Windows 实战部署指南
├── API接口文档.md                    # 后端 API 接口文档
├── 更新日志.md                       # 版本迭代记录
├── README.md                         # 本文档
├── .gitignore                        # Git 忽略配置
├── .gitattributes                    # Git 文件属性配置
├── 启动服务.bat                      # 一键启动脚本（Windows）
├── 停止服务.bat                      # 停止服务脚本
├── start.ps1                         # PowerShell 启动逻辑
├── backend/                          # 后端项目
│   ├── server.js                     # 服务入口
│   ├── package.json                  # 依赖配置
│   ├── config/database.js            # 数据库配置（16张表）
│   ├── middleware/auth.js            # JWT 认证中间件
│   ├── routes/                       # 13个路由模块
│   ├── utils/                        # 工具脚本
│   ├── data/                         # 历史数据 JSON
│   │   ├── china/                    # 中国史事件
│   │   ├── world/                    # 世界史事件
│   │   └── people/                   # 人物关系数据
│   └── README.md                     # 后端说明
└── front/                            # 前端项目
    ├── client/                       # 前端源码
    │   └── src/
    │       ├── pages/                # 18个页面组件
    │       ├── components/           # 通用组件
    │       ├── data/                 # 内置历史数据
    │       ├── store/                # Zustand 状态管理
    │       └── utils/                # 工具函数
    ├── package.json                  # 依赖配置
    └── vite.config.ts                # Vite 构建配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 22.0.0
- npm >= 10.0.0
- 操作系统：Windows / macOS / Linux

### 1. 克隆项目
```bash
git clone <仓库地址>
cd world-history-app
```

### 2. 后端启动
```bash
cd backend
npm install
node utils/initDatabase.js    # 初始化数据库（首次运行）
node utils/importAllEvents.js  # 导入历史事件
node utils/importPeopleRelations.js  # 导入人物关系
node server.js                 # 启动服务
```

### 3. 前端构建
```bash
cd front
npm install --ignore-scripts
$env:NODE_ENV="production"  # Windows PowerShell
node node_modules/vite/bin/vite.js build --config vite.config.ts
```

> 构建后需要替换 `dist/client/index.html` 中的模板变量，详见[部署指南](前后端集成与部署指南.md)。

### 4. 访问
- 前端 + 后端：http://localhost:3000
- 默认管理员：admin@history.com / admin123456

### Windows 一键启动
双击项目根目录下的 `启动服务.bat` 即可一键启动。

## 📚 文档

| 文档 | 说明 |
|------|------|
| [项目文档.html](项目文档.html) | 项目完整文档（功能、架构、数据模型） |
| [前后端集成与部署指南.md](前后端集成与部署指南.md) | 通用部署指南（理论版） |
| [部署与运行实战指南.md](部署与运行实战指南.md) | Windows 环境实战部署指南 |
| [API接口文档.md](API接口文档.md) | 后端 55 个 API 接口详细说明 |
| [更新日志.md](更新日志.md) | 版本迭代记录 |

## 📊 当前数据规模

| 数据类型 | 数量 |
|----------|------|
| 历史事件 | 37 个 |
| 历史人物 | 44 位 |
| 人物关系 | 33 条 |
| 数据库表 | 16 张 |
| 后端路由 | 13 个 |
| API 接口 | 55 个 |
| 前端页面 | 18 个 |

## 🎯 内容分级

| 等级 | 目标年龄 | 内容特点 |
|------|----------|----------|
| 幼儿园 | 3-6岁 | 趣味故事、简单概念、图文并茂 |
| 小学 | 7-12岁 | 基础知识、趣味互动、简单测验 |
| 初中 | 13-15岁 | 系统知识、时间线、事件因果 |
| 高中 | 16-18岁 | 深度分析、人物关系、专题研究 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

## 📞 联系方式

如有问题或建议，欢迎通过 Issue 联系我们。

---

**最后更新**：2026-09-06  
**版本**：V3.0
