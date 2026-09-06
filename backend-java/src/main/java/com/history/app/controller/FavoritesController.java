package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.Favorite;
import com.history.app.mapper.FavoriteMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 收藏模块
 */
@RestController
@RequestMapping("/api/favorites")
@Tag(name = "收藏", description = "收藏管理")
public class FavoritesController {

    @Autowired
    private FavoriteMapper favoriteMapper;

    @GetMapping
    @Operation(summary = "获取收藏列表")
    public Result<List<Favorite>> getFavorites(@RequestParam(required = false) String contentType) {
        String userId = UserContext.getUserId();
        LambdaQueryWrapper<Favorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Favorite::getUserId, userId);
        if (contentType != null) wrapper.eq(Favorite::getContentType, contentType);
        wrapper.orderByDesc(Favorite::getCreatedAt);
        return Result.success(favoriteMapper.selectList(wrapper));
    }

    @PostMapping
    @Operation(summary = "添加收藏")
    public Result<Favorite> addFavorite(@RequestBody Map<String, String> body) {
        String userId = UserContext.getUserId();
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setContentType(body.get("content_type"));
        favorite.setContentId(body.get("content_id"));
        favorite.setCreatedAt(LocalDateTime.now().toString());
        favoriteMapper.insert(favorite);
        return Result.success("收藏成功", favorite);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除收藏（按ID）")
    public Result<Void> deleteFavorite(@PathVariable String id) {
        favoriteMapper.deleteById(id);
        return Result.success("取消收藏");
    }

    @DeleteMapping("/by-content/{contentType}/{contentId}")
    @Operation(summary = "删除收藏（按内容）")
    public Result<Void> deleteFavoriteByContent(@PathVariable String contentType, @PathVariable String contentId) {
        String userId = UserContext.getUserId();
        favoriteMapper.delete(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getContentType, contentType)
                .eq(Favorite::getContentId, contentId));
        return Result.success("取消收藏");
    }
}
