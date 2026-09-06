@echo off
chcp 65001 >nul
title 世界历史学习平台 - Java 后端

echo ============================================
echo   世界历史学习平台 - Java 后端启动
echo ============================================
echo.

REM 检查 Java 是否安装
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Java 环境，请先安装 JDK 17+
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)

REM 检查 JAR 包是否存在
if not exist "target\world-history-backend-1.0.0.jar" (
    echo [提示] 未找到编译后的 JAR 包，开始编译...
    call mvn clean package -DskipTests
    if %errorlevel% neq 0 (
        echo [错误] 编译失败，请检查 Maven 配置
        pause
        exit /b 1
    )
)

echo [信息] 启动 Java 后端服务...
echo [信息] 服务地址: http://localhost:3000
echo [信息] API 文档: http://localhost:3000/swagger-ui.html
echo [信息] 健康检查: http://localhost:3000/api/health
echo.
echo [提示] 按 Ctrl+C 停止服务
echo.

java -jar target\world-history-backend-1.0.0.jar

pause
