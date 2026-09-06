package com.history.app.controller;

import com.history.app.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康检查模块
 */
@RestController
@RequestMapping("/api")
@Tag(name = "健康检查", description = "服务健康检查")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "健康检查")
    public Result<Void> health() {
        return Result.success("API is running");
    }
}
