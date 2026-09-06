package com.history.app.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.history.app.common.JwtUtil;
import com.history.app.entity.User;
import com.history.app.exception.BusinessException;
import com.history.app.mapper.UserMapper;
import com.history.app.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证服务实现
 */
@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Map<String, Object> register(String username, String email, String password, String defaultLevel) {
        // 检查邮箱是否已注册
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (count > 0) {
            throw new BusinessException("邮箱已被注册", 409, "EMAIL_EXISTS");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDefaultLevel(defaultLevel != null ? defaultLevel : "junior");
        user.setStorageMode("local");
        user.setTheme("light");
        user.setFontSize("medium");
        user.setCreatedAt(LocalDateTime.now().toString());
        user.setUpdatedAt(LocalDateTime.now().toString());
        userMapper.insert(user);

        String token = jwtUtil.generateToken(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("user", user);
        result.put("token", token);
        return result;
    }

    @Override
    public Map<String, Object> login(String account, String password) {
        // 同时支持邮箱和用户名登录
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, account)
                .or()
                .eq(User::getUsername, account));

        if (user == null) {
            throw new BusinessException("用户不存在", 404, "USER_NOT_FOUND");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException("密码错误", 401, "WRONG_PASSWORD");
        }

        user.setLastSyncAt(LocalDateTime.now().toString());
        userMapper.updateById(user);

        String token = jwtUtil.generateToken(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("user", user);
        result.put("token", token);
        return result;
    }

    @Override
    public User getUserById(String userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在", 404, "USER_NOT_FOUND");
        }
        return user;
    }

    @Override
    public User updateUser(String userId, Map<String, Object> updates) {
        User user = getUserById(userId);
        if (updates.containsKey("username")) user.setUsername((String) updates.get("username"));
        if (updates.containsKey("default_level")) user.setDefaultLevel((String) updates.get("default_level"));
        if (updates.containsKey("theme")) user.setTheme((String) updates.get("theme"));
        if (updates.containsKey("font_size")) user.setFontSize((String) updates.get("font_size"));
        user.setUpdatedAt(LocalDateTime.now().toString());
        userMapper.updateById(user);
        return user;
    }

    @Override
    public void updatePassword(String userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException("原密码错误", 400, "WRONG_OLD_PASSWORD");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now().toString());
        userMapper.updateById(user);
    }

    @Override
    public void updateStorageMode(String userId, String storageMode) {
        User user = getUserById(userId);
        user.setStorageMode(storageMode);
        user.setUpdatedAt(LocalDateTime.now().toString());
        userMapper.updateById(user);
    }

    @Override
    public void deleteAccount(String userId, String password) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException("密码错误", 400, "WRONG_PASSWORD");
        }
        userMapper.deleteById(userId);
    }
}
