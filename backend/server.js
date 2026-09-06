require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const db = require('./config/database');

// 路由引入
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const peopleRoutes = require('./routes/people');
const quizRoutes = require('./routes/quizzes');
const noteRoutes = require('./routes/notes');
const progressRoutes = require('./routes/progress');
const syncRoutes = require('./routes/sync');
const favoriteRoutes = require('./routes/favorites');
const achievementRoutes = require('./routes/achievements');
const studySessionRoutes = require('./routes/studySessions');
const statsRoutes = require('./routes/stats');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://sf3-scmcdn-cn.feishucdn.com", "https://lf3-short.ibytedapm.com", "https://lf3-cdn-tos.bytescm.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      workerSrc: ["'self'", "blob:"],
      upgradeInsecureRequests: null,
    },
  },
  strictTransportSecurity: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// CORS 配置
const corsOptions = {
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api/', limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（数据目录）
app.use('/data', express.static(path.join(__dirname, 'data')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/data', dataRoutes);

// 前端静态文件托管
const frontendDistPath = path.join(__dirname, '..', 'front', 'dist', 'client');
if (require('fs').existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  console.log('前端静态文件已托管:', frontendDistPath);
} else {
  console.log('警告: 前端构建产物未找到:', frontendDistPath);
}

// SPA 回退：所有非 API 的 GET 请求返回 index.html
app.get(/^\/(?!api).*/, (req, res, next) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// 404 处理
app.use('/api', (req, res) => {
  res.status(404).json({ error: '接口不存在', path: req.path });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[' + new Date().toISOString() + '] 错误:', err.message);
  console.error(err.stack);
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: '认证令牌已过期', code: 'TOKEN_EXPIRED' });
  }
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  世界历史学习应用 - 后端服务');
  console.log('========================================');
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  端口: ${PORT}`);
  console.log(`  数据库: ${process.env.DB_PATH || './data/history.db'}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log('========================================');
});

module.exports = app;
