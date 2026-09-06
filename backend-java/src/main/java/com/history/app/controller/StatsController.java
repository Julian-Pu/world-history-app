package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.DailyStat;
import com.history.app.entity.LearningProgress;
import com.history.app.entity.StudySession;
import com.history.app.mapper.DailyStatMapper;
import com.history.app.mapper.LearningProgressMapper;
import com.history.app.mapper.StudySessionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 统计模块（与 Node.js 版表结构一致）
 */
@RestController
@RequestMapping("/api/stats")
@Tag(name = "统计", description = "学习统计、每日统计、概览")
public class StatsController {

    @Autowired
    private StudySessionMapper studySessionMapper;

    @Autowired
    private LearningProgressMapper progressMapper;

    @Autowired
    private DailyStatMapper dailyStatMapper;

    @GetMapping("/overview")
    @Operation(summary = "获取学习概览")
    public Result<Map<String, Object>> getOverview() {
        String userId = UserContext.getUserId();

        List<StudySession> sessions = studySessionMapper.selectList(
                new LambdaQueryWrapper<StudySession>().eq(StudySession::getUserId, userId));
        int totalStudyTime = sessions.stream().mapToInt(s -> s.getDuration() != null ? s.getDuration() : 0).sum();

        Long totalEventsRead = progressMapper.selectCount(
                new LambdaQueryWrapper<LearningProgress>()
                        .eq(LearningProgress::getUserId, userId)
                        .eq(LearningProgress::getContentType, "event")
                        .eq(LearningProgress::getStatus, "completed"));

        Long totalPeopleRead = progressMapper.selectCount(
                new LambdaQueryWrapper<LearningProgress>()
                        .eq(LearningProgress::getUserId, userId)
                        .eq(LearningProgress::getContentType, "person")
                        .eq(LearningProgress::getStatus, "completed"));

        Long totalDays = dailyStatMapper.selectCount(
                new LambdaQueryWrapper<DailyStat>().eq(DailyStat::getUserId, userId));

        Map<String, Object> result = new HashMap<>();
        result.put("total_study_time", totalStudyTime);
        result.put("total_events_read", totalEventsRead);
        result.put("total_people_read", totalPeopleRead);
        result.put("total_days", totalDays);
        result.put("current_streak", 0);
        return Result.success(result);
    }

    @GetMapping("/daily")
    @Operation(summary = "获取每日统计")
    public Result<List<DailyStat>> getDailyStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        String userId = UserContext.getUserId();
        if (startDate == null) startDate = LocalDate.now().minusDays(30).format(DateTimeFormatter.ISO_LOCAL_DATE);
        if (endDate == null) endDate = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        LambdaQueryWrapper<DailyStat> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DailyStat::getUserId, userId)
                .between(DailyStat::getDate, startDate, endDate)
                .orderByAsc(DailyStat::getDate);
        return Result.success(dailyStatMapper.selectList(wrapper));
    }
}
