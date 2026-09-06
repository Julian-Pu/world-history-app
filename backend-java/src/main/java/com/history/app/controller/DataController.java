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

import java.util.List;
import java.util.Map;

/**
 * 数据管理模块
 */
@RestController
@RequestMapping("/api/data")
@Tag(name = "数据管理", description = "按类型清除数据")
public class DataController {

    @Autowired
    private LearningProgressMapper progressMapper;
    @Autowired
    private FavoriteMapper favoriteMapper;
    @Autowired
    private NoteMapper noteMapper;
    @Autowired
    private QuizRecordMapper quizRecordMapper;
    @Autowired
    private WrongQuestionMapper wrongQuestionMapper;
    @Autowired
    private AchievementMapper achievementMapper;
    @Autowired
    private StudySessionMapper studySessionMapper;

    @PostMapping("/clear")
    @Operation(summary = "清除数据（按类型和范围）")
    public Result<Map<String, Object>> clearData(@RequestBody Map<String, Object> body) {
        String userId = UserContext.getUserId();
        String scope = (String) body.getOrDefault("scope", "all");
        List<String> types = (List<String>) body.get("types");

        int cleared = 0;

        // Java 后端只处理云端数据清除
        // scope=local 时前端自行清除 localStorage，这里返回成功
        if ("local".equals(scope)) {
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("cleared", 0);
            result.put("scope", "local");
            result.put("message", "本地数据由前端清除");
            return Result.success("本地数据清除完成", result);
        }

        if (types.contains("progress")) {
            cleared += progressMapper.delete(new LambdaQueryWrapper<LearningProgress>().eq(LearningProgress::getUserId, userId));
        }
        if (types.contains("favorites")) {
            cleared += favoriteMapper.delete(new LambdaQueryWrapper<Favorite>().eq(Favorite::getUserId, userId));
        }
        if (types.contains("notes")) {
            cleared += noteMapper.delete(new LambdaQueryWrapper<Note>().eq(Note::getUserId, userId));
        }
        if (types.contains("quizzes")) {
            cleared += quizRecordMapper.delete(new LambdaQueryWrapper<QuizRecord>().eq(QuizRecord::getUserId, userId));
        }
        if (types.contains("wrong_questions")) {
            cleared += wrongQuestionMapper.delete(new LambdaQueryWrapper<WrongQuestion>().eq(WrongQuestion::getUserId, userId));
        }
        if (types.contains("achievements")) {
            cleared += achievementMapper.delete(new LambdaQueryWrapper<Achievement>().eq(Achievement::getUserId, userId));
        }
        if (types.contains("study_time")) {
            cleared += studySessionMapper.delete(new LambdaQueryWrapper<StudySession>().eq(StudySession::getUserId, userId));
        }

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("cleared", cleared);
        result.put("scope", scope);
        result.put("types", types);
        return Result.success("数据清除成功", result);
    }
}
