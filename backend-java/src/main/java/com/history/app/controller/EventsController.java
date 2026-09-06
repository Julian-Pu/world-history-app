package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.Event;
import com.history.app.entity.LearningProgress;
import com.history.app.mapper.EventMapper;
import com.history.app.mapper.LearningProgressMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 历史事件模块（与 Node.js 版表结构一致）
 */
@RestController
@RequestMapping("/api/events")
@Tag(name = "历史事件", description = "事件列表、详情、时间线、统计")
public class EventsController {

    @Autowired
    private EventMapper eventMapper;

    @Autowired
    private LearningProgressMapper progressMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    @Operation(summary = "获取事件列表")
    public Result<Map<String, Object>> getEvents(
            @RequestParam(required = false) String era,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer limit) {

        LambdaQueryWrapper<Event> wrapper = new LambdaQueryWrapper<>();
        if (era != null) wrapper.eq(Event::getPeriod, era);
        if (region != null) wrapper.eq(Event::getRegion, region);
        if (keyword != null) wrapper.like(Event::getTitle, keyword);
        wrapper.orderByAsc(Event::getStartDate);

        Page<Event> pageResult = eventMapper.selectPage(new Page<>(page, limit), wrapper);
        String userId = UserContext.getUserId();

        List<Map<String, Object>> list = pageResult.getRecords().stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", e.getId());
            item.put("title", e.getTitle());
            item.put("era", e.getPeriod());
            item.put("region", e.getRegion());
            item.put("start_year", parseYear(e.getStartDate()));
            item.put("end_year", parseYear(e.getEndDate()));
            item.put("location", e.getLocation());
            item.put("summary", extractSummary(e.getLevelContents(), level));
            boolean isRead = false;
            if (userId != null) {
                Long count = progressMapper.selectCount(new LambdaQueryWrapper<LearningProgress>()
                        .eq(LearningProgress::getUserId, userId)
                        .eq(LearningProgress::getContentType, "event")
                        .eq(LearningProgress::getContentId, e.getId())
                        .eq(LearningProgress::getStatus, "completed"));
                isRead = count > 0;
            }
            item.put("is_read", isRead);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageResult.getCurrent());
        pagination.put("limit", pageResult.getSize());
        pagination.put("total", pageResult.getTotal());
        pagination.put("total_pages", pageResult.getPages());

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("pagination", pagination);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取事件详情")
    public Result<Map<String, Object>> getEventDetail(@PathVariable String id,
                                                        @RequestParam(required = false) String level) {
        Event event = eventMapper.selectById(id);
        if (event == null) {
            return Result.error("事件不存在", "NOT_FOUND");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", event.getId());
        result.put("title", event.getTitle());
        result.put("era", event.getPeriod());
        result.put("region", event.getRegion());
        result.put("start_year", parseYear(event.getStartDate()));
        result.put("end_year", parseYear(event.getEndDate()));
        result.put("location", event.getLocation());
        result.put("content", parseJson(event.getLevelContents()));
        result.put("key_figure_ids", parseJsonArray(event.getRelatedPeople()));
        result.put("related_events", parseJsonArray(event.getRelatedEvents()));

        String userId = UserContext.getUserId();
        if (userId != null) {
            Long readCount = progressMapper.selectCount(new LambdaQueryWrapper<LearningProgress>()
                    .eq(LearningProgress::getUserId, userId)
                    .eq(LearningProgress::getContentType, "event")
                    .eq(LearningProgress::getContentId, id)
                    .eq(LearningProgress::getStatus, "completed"));
            result.put("is_read", readCount > 0);
        }
        return Result.success(result);
    }

    @GetMapping("/timeline/data")
    @Operation(summary = "获取时间线数据")
    public Result<List<Map<String, Object>>> getTimelineData(
            @RequestParam(required = false) String era,
            @RequestParam(required = false) String region) {

        LambdaQueryWrapper<Event> wrapper = new LambdaQueryWrapper<>();
        if (era != null) wrapper.eq(Event::getPeriod, era);
        if (region != null) wrapper.eq(Event::getRegion, region);
        wrapper.orderByAsc(Event::getStartDate);

        List<Event> events = eventMapper.selectList(wrapper);
        String userId = UserContext.getUserId();

        List<Map<String, Object>> result = events.stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", e.getId());
            item.put("title", e.getTitle());
            item.put("era", e.getPeriod());
            item.put("region", e.getRegion());
            item.put("start_year", parseYear(e.getStartDate()));
            item.put("end_year", parseYear(e.getEndDate()));
            boolean isRead = false;
            if (userId != null) {
                Long count = progressMapper.selectCount(new LambdaQueryWrapper<LearningProgress>()
                        .eq(LearningProgress::getUserId, userId)
                        .eq(LearningProgress::getContentType, "event")
                        .eq(LearningProgress::getContentId, e.getId())
                        .eq(LearningProgress::getStatus, "completed"));
                isRead = count > 0;
            }
            item.put("is_read", isRead);
            return item;
        }).collect(Collectors.toList());

        return Result.success(result);
    }

    @GetMapping("/stats/by-period")
    @Operation(summary = "按时代统计事件数量")
    public Result<List<Map<String, Object>>> getStatsByPeriod() {
        List<Event> all = eventMapper.selectList(null);
        Map<String, Long> grouped = all.stream()
                .collect(Collectors.groupingBy(Event::getPeriod, Collectors.counting()));
        List<Map<String, Object>> result = grouped.entrySet().stream()
                .map(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("era", e.getKey());
                    item.put("count", e.getValue());
                    return item;
                })
                .collect(Collectors.toList());
        return Result.success(result);
    }

    private Integer parseYear(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try {
            // 处理公元前年份（负数）
            if (dateStr.startsWith("-") || dateStr.startsWith("前")) {
                String num = dateStr.replaceAll("[^0-9]", "");
                return -Integer.parseInt(num);
            }
            return Integer.parseInt(dateStr.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private String extractSummary(String contentJson, String level) {
        try {
            Map<String, Object> content = objectMapper.readValue(contentJson, new TypeReference<Map<String, Object>>() {});
            String targetLevel = level != null ? level : "junior";
            if (content.containsKey(targetLevel)) {
                Map<String, Object> levelContent = (Map<String, Object>) content.get(targetLevel);
                return (String) levelContent.get("summary");
            }
        } catch (Exception e) {
            // ignore
        }
        return "";
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
