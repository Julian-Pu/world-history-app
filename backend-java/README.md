# 世界历史学习平台 - Java 后端

> 世界历史学习平台的 Java 后端实现，与 Node.js 版 API 接口完全一致，前端零改动即可切换。

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 框架 | Spring Boot | 3.2.5 |
| ORM | MyBatis-Plus | 3.5.5 |
| 数据库 | SQLite | 3.45.2 |
| 认证 | Spring Security + JWT | - |
| API 文档 | springdoc-openapi（Swagger） | 2.3.0 |
| 构建工具 | Maven | 3.9+ |
| JDK | 17+ | - |

## 与 Node.js 版的对应关系

| Node.js 版 | Java 版 | 说明 |
|------------|---------|------|
| Express 路由（13个模块） | Spring Boot Controller（13个类） | API 路径完全一致 |
| better-sqlite3 | MyBatis-Plus + SQLite JDBC | 数据库结构完全一致 |
| jsonwebtoken | jjwt 0.12.5 | JWT 认证 |
| bcryptjs | Spring Security BCryptPasswordEncoder | 密码加密（兼容） |
| helmet | Spring Security 配置 | 安全头 |
| 16张数据表 | 16个 Entity 实体类 | 表结构完全一致 |
| 55个 API 接口 | 55个 Controller 方法 | 接口完全一致 |

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.9+

### 1. 编译打包

```bash
cd backend-java
mvn clean package -DskipTests
```

### 2. 运行

```bash
java -jar target/world-history-backend-1.0.0.jar
```

或使用 Maven 直接运行：

```bash
mvn spring-boot:run
```

### 3. 验证

- 服务地址：http://localhost:3000
- 健康检查：http://localhost:3000/api/health
- API 文档：http://localhost:3000/swagger-ui.html
- 默认管理员：admin@history.com / admin123456

## 项目结构

```
backend-java/
├── pom.xml                                    # Maven 配置
├── README.md                                  # 本文档
├── src/main/java/com/history/app/
│   ├── HistoryApplication.java                # 启动类
│   ├── config/
│   │   ├── SecurityConfig.java                # Spring Security 配置
│   │   ├── MybatisPlusConfig.java             # MyBatis-Plus 配置
│   │   ├── WebMvcConfig.java                  # 拦截器 + 跨域配置
│   │   └── DataInitializer.java               # 启动时数据库初始化
│   ├── controller/                            # 13个 Controller
│   │   ├── AuthController.java                # 认证
│   │   ├── EventsController.java              # 历史事件
│   │   ├── PeopleController.java              # 历史人物+关系图谱
│   │   ├── ProgressController.java            # 学习进度
│   │   ├── NotesController.java               # 学习笔记
│   │   ├── FavoritesController.java           # 收藏
│   │   ├── QuizzesController.java             # 测验
│   │   ├── AchievementsController.java        # 成就
│   │   ├── StudySessionsController.java       # 学习时长
│   │   ├── StatsController.java               # 统计
│   │   ├── SyncController.java                # 数据同步
│   │   ├── DataController.java                # 数据清除
│   │   └── HealthController.java              # 健康检查
│   ├── service/                               # 服务层
│   │   ├── AuthService.java
│   │   └── impl/AuthServiceImpl.java
│   ├── mapper/                                # 16个 Mapper 接口
│   ├── entity/                                # 16个实体类
│   ├── dto/                                   # 数据传输对象
│   ├── common/                                # 通用类
│   │   ├── Result.java                        # 统一响应格式
│   │   ├── JwtUtil.java                       # JWT 工具
│   │   ├── JwtInterceptor.java                # JWT 拦截器
│   │   └── UserContext.java                   # 用户上下文
│   └── exception/                             # 异常处理
│       ├── BusinessException.java
│       └── GlobalExceptionHandler.java
└── src/main/resources/
    ├── application.yml                        # 应用配置
    └── db/schema.sql                          # 数据库初始化脚本
```

## 配置说明

### application.yml 主要配置

```yaml
server:
  port: 3000                          # 服务端口（与 Node.js 版一致）

spring:
  datasource:
    url: jdbc:sqlite:./data/history.db  # SQLite 数据库路径
  web:
    resources:
      static-locations: classpath:/static/,file:../front/dist/client/  # 前端静态资源

jwt:
  secret: your-secret-key             # JWT 密钥（生产环境务必修改）
  expiration: 604800000               # 7天（毫秒）

app:
  default-admin:
    email: admin@history.com
    password: admin123456
    username: admin
```

## 数据库

### 自动初始化

应用启动时会自动执行 `src/main/resources/db/schema.sql`，创建 16 张数据表和默认管理员账号。

### 复用 Node.js 版数据库

由于数据库结构完全一致，可以直接复用 Node.js 版的数据库文件：

```bash
# 复制 Node.js 版数据库到 Java 后端目录
cp ../backend/data/history.db ./data/history.db
```

### 导入历史数据

Java 后端启动时会自动建表，但历史事件和人物数据需要从 Node.js 版导入。最简单的方式是直接复用 Node.js 版的 `history.db` 文件（已包含所有数据）。

## API 接口

所有 API 接口与 Node.js 版完全一致，详见项目根目录的 `API接口文档.md`。

启动后可访问 Swagger UI 查看交互式 API 文档：
- http://localhost:3000/swagger-ui.html

## 与前端集成

### 方式一：Java 后端托管前端静态文件

修改 `application.yml` 中的静态资源路径，指向前端构建产物目录：

```yaml
spring:
  web:
    resources:
      static-locations: classpath:/static/,file:../front/dist/client/
```

然后访问 http://localhost:3000 即可同时访问前端和后端 API。

### 方式二：前后端分离部署

前端部署到 Nginx 或其他静态服务器，后端独立运行，前端通过 API 地址访问后端。

## 切换后端（Node.js ↔ Java）

由于 API 接口完全一致，前端无需任何改动即可在两个后端之间切换：

1. **停止 Node.js 后端**：停止占用 3000 端口的 Node 进程
2. **启动 Java 后端**：`java -jar target/world-history-backend-1.0.0.jar`
3. **复用数据库**：将 Node.js 版的 `history.db` 复制到 Java 后端的 `data/` 目录
4. **刷新浏览器**：前端自动连接新的后端

## 性能对比

| 指标 | Node.js 版 | Java 版 |
|------|------------|---------|
| 启动时间 | ~1秒 | ~5-10秒 |
| 内存占用 | ~50MB | ~200-300MB |
| 并发处理 | 异步非阻塞 | 线程池 |
| 开发效率 | 高 | 中 |
| 类型安全 | 弱（TypeScript） | 强（Java） |
| 生态成熟度 | 高 | 非常高 |

## 常见问题

### Q: 启动时报错 "数据库文件不存在"
A: 确保 `data/` 目录存在，应用启动时会自动创建数据库文件和表。

### Q: 如何修改服务端口？
A: 修改 `application.yml` 中的 `server.port`，或启动时指定：`java -jar xxx.jar --server.port=8080`

### Q: 如何修改 JWT 密钥？
A: 修改 `application.yml` 中的 `jwt.secret`，生产环境务必使用随机字符串。

### Q: 密码加密与 Node.js 版兼容吗？
A: 兼容。两者都使用 BCrypt 算法，密码哈希可以互通。

### Q: 可以同时运行 Node.js 和 Java 后端吗？
A: 可以，但需要修改其中一个的端口（默认都是 3000）。

## 许可证

MIT License
