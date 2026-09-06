package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.StudySession;
import com.history.app.mapper.StudySessionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 学习时长模块
 * 与 Node.js 版接口完全一致：start 返回 session_id，end 接受 duration（秒），list 返回 { list, pagination }
 */
@RestController
@RequestMapping("/api/study-sessions")
@Tag(name = "学习时长", description = "学习会话开始/结束/心跳/列表")
public class StudySessionsController {

    @Autowired
    private StudySessionMapper studySessionMapper;

    @PostMapping("/start")
    @Operation(summary = "开始学习会话")
    public Result<Map<String, Object>> startSession(@RequestBody(required = false) Map<String, String> body) {
        String userId = UserContext.getUserId();
        StudySession session = new StudySession();
        session.setUserId(userId);
        session.setStartTime(LocalDateTime.now().toString());
        if (body != null) {
            session.setContentType(body.get("content_type"));
            session.setContentId(body.get("content_id"));
        }
        studySessionMapper.insert(session);

        // 注意：返回字段名是 session_id，与 Node.js 版一致
        Map<String, Object> result = new HashMap<>();
        result.put("session_id", session.getId());
        result.put("start_time", session.getStartTime());
        return Result.success("会话已开始", result);
    }

    @PostMapping("/{id}/end")
    @Operation(summary = "结束学习会话")
    public Result<StudySession> endSession(@PathVariable String id, @RequestBody Map<String, Object> body) {
        StudySession session = studySessionMapper.selectById(id);
        if (session == null) {
            return Result.error("会话不存在", "NOT_FOUND");
        }
        session.setEndTime(LocalDateTime.now().toString());
        // 注意：duration 单位是秒，与 Node.js 版一致
        if (body.containsKey("duration")) {
            session.setDuration(((Number) body.get("duration")).intValue());
        }
        studySessionMapper.updateById(session);
        return Result.success("会话已结束", session);
    }

    @PostMapping("/{id}/heartbeat")
    @Operation(summary = "学习心跳")
    public Result<Void> heartbeat(@PathVariable String id) {
        // 简化实现：更新结束时间为当前时间
        StudySession session = studySessionMapper.selectById(id);
        if (session != null) {
            session.setEndTime(LocalDateTime.now().toString());
            studySessionMapper.updateById(session);
        }
        return Result.success("心跳已更新");
    }

    @GetMapping
    @Operation(summary = "获取学习会话列表")
    public Result<Map<String, Object>> getSessions(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer limit) {
        String userId = UserContext.getUserId();
        LambdaQueryWrapper<StudySession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StudySession::getUserId, userId);
        wrapper.orderByDesc(StudySession::getStartTime);

        Page<StudySession> pageResult = studySessionMapper.selectPage(new Page<>(page, limit), wrapper);

        // 注意：返回格式是 { list, pagination }，与 Node.js 版一致
        Map<String, Object> result = new HashMap<>();
        result.put("list", pageResult.getRecords());
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageResult.getCurrent());
        pagination.put("limit", pageResult.getSize());
        pagination.put("total", pageResult.getTotal());
        pagination.put("total_pages", pageResult.getPages());
        result.put("pagination", pagination);
        return Result.success(result);
    }

    @GetMapping("/active/current")
    @Operation(summary = "获取当前活跃会话")
    public Result<StudySession> getActiveSession() {
        String userId = UserContext.getUserId();
        StudySession session = studySessionMapper.selectOne(
                new LambdaQueryWrapper<StudySession>()
                        .eq(StudySession::getUserId, userId)
                        .isNull(StudySession::getEndTime)
                        .orderByDesc(StudySession::getStartTime)
                        .last("LIMIT 1"));
        return Result.success(session);
    }
}
