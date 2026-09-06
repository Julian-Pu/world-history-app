package com.history.app.controller;

import com.history.app.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 自定义错误控制器
 * 统一处理 404 等错误，避免平台监控接口（如 /spark/...）返回 500
 */
@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Result<Void>> handleError(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
        String requestUri = (String) request.getAttribute("jakarta.servlet.error.request_uri");

        if (statusCode == null) {
            statusCode = 500;
        }

        String message;
        String errorCode;

        if (statusCode == 404) {
            message = "接口不存在: " + (requestUri != null ? requestUri : "unknown");
            errorCode = "NOT_FOUND";
        } else if (statusCode == 401) {
            message = "未授权";
            errorCode = "UNAUTHORIZED";
        } else if (statusCode == 403) {
            message = "禁止访问";
            errorCode = "FORBIDDEN";
        } else {
            message = "服务器内部错误，状态码: " + statusCode;
            errorCode = "INTERNAL_ERROR";
        }

        return ResponseEntity.status(statusCode)
                .body(Result.error(message, errorCode));
    }
}
