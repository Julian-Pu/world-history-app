package com.history.app.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;

/**
 * 统一响应结果（与 Node.js 版格式完全一致）
 * { success, message, data, timestamp }
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {

    private boolean success;
    private String message;
    private T data;
    private String timestamp;
    private String error;

    private Result() {
        this.timestamp = Instant.now().toString();
    }

    public static <T> Result<T> success() {
        Result<T> r = new Result<>();
        r.setSuccess(true);
        r.setMessage("操作成功");
        return r;
    }

    public static <T> Result<T> success(String message) {
        Result<T> r = new Result<>();
        r.setSuccess(true);
        r.setMessage(message);
        return r;
    }

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.setSuccess(true);
        r.setMessage("操作成功");
        r.setData(data);
        return r;
    }

    public static <T> Result<T> success(String message, T data) {
        Result<T> r = new Result<>();
        r.setSuccess(true);
        r.setMessage(message);
        r.setData(data);
        return r;
    }

    public static <T> Result<T> error(String message) {
        Result<T> r = new Result<>();
        r.setSuccess(false);
        r.setMessage(message);
        r.setError("ERROR");
        return r;
    }

    public static <T> Result<T> error(String message, String errorCode) {
        Result<T> r = new Result<>();
        r.setSuccess(false);
        r.setMessage(message);
        r.setError(errorCode);
        return r;
    }
}
