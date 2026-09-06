package com.history.app.service;

import com.history.app.entity.User;

import java.util.Map;

/**
 * 认证服务
 */
public interface AuthService {

    Map<String, Object> register(String username, String email, String password, String defaultLevel);

    Map<String, Object> login(String account, String password);

    User getUserById(String userId);

    User updateUser(String userId, Map<String, Object> updates);

    void updatePassword(String userId, String oldPassword, String newPassword);

    void updateStorageMode(String userId, String storageMode);

    void deleteAccount(String userId, String password);
}
