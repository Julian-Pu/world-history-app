package com.history.app.config;

import com.history.app.entity.User;
import com.history.app.mapper.UserMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * 数据库初始化器
 * 应用启动时自动执行建表 SQL 和创建默认管理员
 */
@Component
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.email}")
    private String adminEmail;

    @Value("${app.default-admin.password}")
    private String adminPassword;

    @Value("${app.default-admin.username}")
    private String adminUsername;

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void init() {
        try {
            // 1. 执行建表 SQL（使用 Spring ScriptUtils，更可靠）
            log.info("开始初始化数据库...");
            ClassPathResource resource = new ClassPathResource("db/schema.sql");
            ScriptUtils.executeSqlScript(dataSource.getConnection(), resource);
            log.info("数据库表初始化完成");

            // 2. 创建默认管理员（如果不存在）
            Long count = userMapper.selectCount(null);
            if (count == 0) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setEmail(adminEmail);
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                admin.setDefaultLevel("senior");
                admin.setStorageMode("cloud");
                admin.setTheme("light");
                admin.setFontSize("medium");
                admin.setCreatedAt(LocalDateTime.now().toString());
                admin.setUpdatedAt(LocalDateTime.now().toString());
                userMapper.insert(admin);
                log.info("默认管理员创建成功：{}", adminEmail);
            } else {
                log.info("管理员已存在，跳过创建");
            }

            log.info("数据库初始化完成");
        } catch (Exception e) {
            log.error("数据库初始化失败", e);
            throw new RuntimeException("数据库初始化失败", e);
        }
    }
}
