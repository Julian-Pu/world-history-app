package com.history.app;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 世界历史学习平台 - Java 后端启动类
 * 与 Node.js 版 API 接口完全一致，前端零改动
 */
@SpringBootApplication
@MapperScan("com.history.app.mapper")
public class HistoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(HistoryApplication.class, args);
        System.out.println("""
                ================================================
                  世界历史学习平台 - Java 后端启动成功
                  服务地址: http://localhost:3000
                  API 文档: http://localhost:3000/swagger-ui.html
                  健康检查: http://localhost:3000/api/health
                ================================================
                """);
    }
}
