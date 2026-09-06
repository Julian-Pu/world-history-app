package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.Achievement;
import com.history.app.entity.BadgeDefinition;
import com.history.app.mapper.AchievementMapper;
import com.history.app.mapper.BadgeDefinitionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 成就模块
 */
@RestController
@RequestMapping("/api/achievements")
@Tag(name = "成就", description = "成就列表、最近解锁")
public class AchievementsController {

    @Autowired
    private AchievementMapper achievementMapper;

    @Autowired
    private BadgeDefinitionMapper badgeDefinitionMapper;

    @GetMapping
    @Operation(summary = "获取成就列表")
    public Result<List<Map<String, Object>>> getAchievements() {
        String userId = UserContext.getUserId();
        List<BadgeDefinition> badges = badgeDefinitionMapper.selectList(null);
        List<Achievement> unlocked = achievementMapper.selectList(
                new LambdaQueryWrapper<Achievement>().eq(Achievement::getUserId, userId));
        Set<String> unlockedIds = unlocked.stream().map(Achievement::getBadgeId).collect(Collectors.toSet());
        Map<String, Achievement> unlockedMap = unlocked.stream()
                .collect(Collectors.toMap(Achievement::getBadgeId, a -> a));

        List<Map<String, Object>> result = badges.stream().map(b -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", b.getId());
            item.put("badge_id", b.getName());
            item.put("name", b.getName());
            item.put("description", b.getDescription());
            item.put("category", b.getCategory());
            item.put("icon", b.getIcon());
            item.put("unlocked", unlockedIds.contains(b.getName()));
            if (unlockedMap.containsKey(b.getName())) {
                item.put("unlocked_at", unlockedMap.get(b.getName()).getUnlockedAt());
            }
            return item;
        }).collect(Collectors.toList());
        return Result.success(result);
    }

    @GetMapping("/recent")
    @Operation(summary = "获取最近解锁的成就")
    public Result<List<Achievement>> getRecentAchievements() {
        String userId = UserContext.getUserId();
        List<Achievement> list = achievementMapper.selectList(
                new LambdaQueryWrapper<Achievement>()
                        .eq(Achievement::getUserId, userId)
                        .orderByDesc(Achievement::getUnlockedAt)
                        .last("LIMIT 5"));
        return Result.success(list);
    }
}
