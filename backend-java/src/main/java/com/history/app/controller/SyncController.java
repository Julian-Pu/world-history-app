package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.*;
import com.history.app.mapper.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据同步模块（与 Node.js 版表结构一致）
 */
@RestController
@RequestMapping("/api/sync")
@Tag(name = "数据同步", description = "云端同步、推送、拉取、状态")
public class SyncController {

    @Autowired
    private LearningProgressMapper progressMapper;

    @Autowired
    private NoteMapper noteMapper;

    @Autowired
    private FavoriteMapper favoriteMapper;

    @Autowired
    private StudySessionMapper sessionMapper;

    @Autowired
    private SyncLogMapper syncLogMapper;

    @PostMapping("/push")
    @Operation(summary = "推送本地数据到云端")
    public Result<Map<String, Object>> pushData(@RequestBody Map<String, Object> body) {
        String userId = UserContext.getUserId();
        int pushed = 0;

        List<Map<String, Object>> progressList = (List<Map<String, Object>>) body.get("progress");
        if (progressList != null) {
            for (Map<String, Object> p : progressList) {
                LearningProgress lp = new LearningProgress();
                lp.setUserId(userId);
                lp.setContentType((String) p.get("content_type"));
                lp.setContentId((String) p.get("content_id"));
                lp.setStatus((String) p.getOrDefault("status", "completed"));
                lp.setLevel((String) p.get("level"));
                try { progressMapper.insert(lp); pushed++; } catch (Exception e) { /* ignore duplicate */ }
            }
        }

        List<Map<String, Object>> notesList = (List<Map<String, Object>>) body.get("notes");
        if (notesList != null) {
            for (Map<String, Object> n : notesList) {
                Note note = new Note();
                note.setUserId(userId);
                note.setTitle((String) n.get("title"));
                note.setContent((String) n.get("content"));
                note.setContentType((String) n.get("content_type"));
                note.setContentId((String) n.get("content_id"));
                note.setCreatedAt(LocalDateTime.now().toString());
                noteMapper.insert(note);
                pushed++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("pushed_count", pushed);
        result.put("synced_at", LocalDateTime.now().toString());
        return Result.success("数据同步成功", result);
    }

    @GetMapping("/pull")
    @Operation(summary = "从云端拉取数据")
    public Result<Map<String, Object>> pullData() {
        String userId = UserContext.getUserId();

        List<LearningProgress> progress = progressMapper.selectList(
                new LambdaQueryWrapper<LearningProgress>().eq(LearningProgress::getUserId, userId));
        List<Note> notes = noteMapper.selectList(
                new LambdaQueryWrapper<Note>().eq(Note::getUserId, userId).eq(Note::getDeleted, 0));
        List<Favorite> favorites = favoriteMapper.selectList(
                new LambdaQueryWrapper<Favorite>().eq(Favorite::getUserId, userId));
        List<StudySession> sessions = sessionMapper.selectList(
                new LambdaQueryWrapper<StudySession>().eq(StudySession::getUserId, userId));

        Map<String, Object> result = new HashMap<>();
        result.put("progress", progress);
        result.put("notes", notes);
        result.put("favorites", favorites);
        result.put("study_sessions", sessions);
        result.put("synced_at", LocalDateTime.now().toString());
        return Result.success(result);
    }

    @GetMapping("/status")
    @Operation(summary = "获取同步状态")
    public Result<Map<String, Object>> getSyncStatus() {
        String userId = UserContext.getUserId();
        Long lastSync = syncLogMapper.selectCount(new LambdaQueryWrapper<SyncLog>().eq(SyncLog::getUserId, userId));
        Map<String, Object> result = new HashMap<>();
        result.put("last_sync_at", lastSync > 0 ? LocalDateTime.now().toString() : null);
        result.put("pending_changes", 0);
        result.put("cloud_enabled", true);
        return Result.success(result);
    }
}
