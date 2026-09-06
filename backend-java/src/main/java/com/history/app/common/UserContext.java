package com.history.app.common;

/**
 * 当前登录用户上下文（ThreadLocal）
 */
public class UserContext {

    private static final ThreadLocal<String> CURRENT_USER_ID = new ThreadLocal<>();

    public static void setUserId(String userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static String getUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
    }
}
