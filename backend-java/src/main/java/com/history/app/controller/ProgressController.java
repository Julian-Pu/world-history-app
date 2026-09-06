package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.LearningProgress;
import com.history.app.mapper.LearningProgressMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 学习进度模块
 */
@RestController
@RequestMapping("/api/progress")
@Tag(name = "学习进度", description = "进度查询、更新、统计")
public class ProgressController {

    @Autowired
    private LearningProgressMapper progressMapper;

    @GetMapping
    @Operation(summary = "获取学习进度列表")
    public Result<List<LearningProgress>> getProgress(
            @RequestParam(required = false) String contentType,
            @RequestParam(required = false) String status) {
        String userId = UserContext.getUserId();
        LambdaQueryWrapper<LearningProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LearningProgress::getUserId, userId);
        if (contentType != null) wrapper.eq(LearningProgress::getContentType, contentType);
        if (status != null) wrapper.eq(LearningProgress::getStatus, status);
        return Result.success(progressMapper.selectList(wrapper));
    }

    @PostMapping("/update")
    @Operation(summary = "更新学习进度")
    public Result<Map<String, Object>> updateProgress(@RequestBody Map<String, Object> body) {
        String userId = UserContext.getUserId();
        String contentType = getString(body, "content_type");
        String contentId = getString(body, "content_id");
        String status = getString(body, "status");

        LearningProgress existing = progressMapper.selectOne(new LambdaQueryWrapper<LearningProgress>()
                .eq(LearningProgress::getUserId, userId)
                .eq(LearningProgress::getContentType, contentType)
                .eq(LearningProgress::getContentId, contentId));

        boolean created = false;
        if (existing == null) {
            existing = new LearningProgress();
            existing.setUserId(userId);
            existing.setContentType(contentType);
            existing.setContentId(contentId);
            existing.setFirstReadAt(LocalDateTime.now().toString());
            created = true;
        }
        existing.setStatus(status);
        if (body.containsKey("level")) existing.setLevel(getString(body, "level"));
        if (body.containsKey("time_spent")) existing.setTimeSpent(getInteger(body, "time_spent"));
        if ("completed".equals(status)) existing.setCompletedAt(LocalDateTime.now().toString());

        if (created) {
            progressMapper.insert(existing);
        } else {
            progressMapper.updateById(existing);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", existing.getId());
        result.put("content_type", existing.getContentType());
        result.put("content_id", existing.getContentId());
        result.put("status", existing.getStatus());
        result.put("created", created);
        return Result.success("进度更新成功", result);
    }

    /**
     * 安全获取字符串值，避免类型转换异常
     */
    private String getString(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val != null ? val.toString() : null;
    }

    /**
     * 安全获取整数值，支持 Integer/Long/Double/String 等多种类型
     */
    private Integer getInteger(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val == null) return null;
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        try {
            return Integer.parseInt(val.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/by-period")
    @Operation(summary = "按时代统计学习进度")
    public Result<List<Map<String, Object>>> getProgressByPeriod() {
        // 简化实现：返回空列表，实际应关联 events 表统计
        return Result.success(java.util.Collections.emptyList());
    }
}
