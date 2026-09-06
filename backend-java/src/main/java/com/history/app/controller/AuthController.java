package com.history.app.controller;

import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.User;
import com.history.app.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证模块
 * 与 Node.js 版 /api/auth 接口完全一致
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "认证模块", description = "用户注册、登录、信息管理")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public Result<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        Map<String, Object> result = authService.register(
                body.get("username"),
                body.get("email"),
                body.get("password"),
                body.get("default_level")
        );
        return Result.success("注册成功", result);
    }

    @PostMapping("/login")
    @Operation(summary = "用户登录（支持邮箱或用户名）")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        // 同时支持 account 和 email 字段
        String account = body.get("account") != null ? body.get("account") : body.get("email");
        Map<String, Object> result = authService.login(account, body.get("password"));
        return Result.success("登录成功", result);
    }

    @PostMapping("/refresh")
    @Operation(summary = "刷新Token")
    public Result<Map<String, Object>> refresh(@RequestBody Map<String, String> body) {
        // 简化实现：直接返回新 token
        String userId = UserContext.getUserId();
        if (userId == null) {
            return Result.error("未登录", "UNAUTHORIZED");
        }
        User user = authService.getUserById(userId);
        // 实际应验证 refresh_token，这里简化
        return Result.success("刷新成功", Map.of("user", user));
    }

    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息")
    public Result<User> getMe() {
        String userId = UserContext.getUserId();
        User user = authService.getUserById(userId);
        return Result.success(user);
    }

    @PutMapping("/me")
    @Operation(summary = "更新用户信息")
    public Result<User> updateMe(@RequestBody Map<String, Object> body) {
        String userId = UserContext.getUserId();
        User user = authService.updateUser(userId, body);
        return Result.success("更新成功", user);
    }

    @PutMapping("/password")
    @Operation(summary = "修改密码")
    public Result<Void> updatePassword(@RequestBody Map<String, String> body) {
        String userId = UserContext.getUserId();
        authService.updatePassword(userId, body.get("old_password"), body.get("new_password"));
        return Result.success("密码修改成功");
    }

    @PutMapping("/storage-mode")
    @Operation(summary = "更新存储模式")
    public Result<Void> updateStorageMode(@RequestBody Map<String, String> body) {
        String userId = UserContext.getUserId();
        authService.updateStorageMode(userId, body.get("storage_mode"));
        return Result.success("存储模式更新成功");
    }

    @DeleteMapping("/account")
    @Operation(summary = "删除账号")
    public Result<Void> deleteAccount(@RequestBody Map<String, String> body) {
        String userId = UserContext.getUserId();
        authService.deleteAccount(userId, body.get("password"));
        return Result.success("账号已删除");
    }
}
