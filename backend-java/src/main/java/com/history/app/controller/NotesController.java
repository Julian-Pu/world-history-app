package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.Note;
import com.history.app.mapper.NoteMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 学习笔记模块
 */
@RestController
@RequestMapping("/api/notes")
@Tag(name = "学习笔记", description = "笔记CRUD")
public class NotesController {

    @Autowired
    private NoteMapper noteMapper;

    @GetMapping
    @Operation(summary = "获取笔记列表")
    public Result<Map<String, Object>> getNotes(
            @RequestParam(required = false) String contentType,
            @RequestParam(required = false) String contentId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer limit) {
        String userId = UserContext.getUserId();
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getUserId, userId);
        if (contentType != null) wrapper.eq(Note::getContentType, contentType);
        if (contentId != null) wrapper.eq(Note::getContentId, contentId);
        if (keyword != null) wrapper.like(Note::getTitle, keyword).or().like(Note::getContent, keyword);
        wrapper.orderByDesc(Note::getUpdatedAt);

        Page<Note> pageResult = noteMapper.selectPage(new Page<>(page, limit), wrapper);
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

    @GetMapping("/{id}")
    @Operation(summary = "获取笔记详情")
    public Result<Note> getNote(@PathVariable String id) {
        Note note = noteMapper.selectById(id);
        return Result.success(note);
    }

    @PostMapping
    @Operation(summary = "创建笔记")
    public Result<Note> createNote(@RequestBody Note note) {
        note.setUserId(UserContext.getUserId());
        note.setCreatedAt(LocalDateTime.now().toString());
        note.setUpdatedAt(LocalDateTime.now().toString());
        note.setDeleted(0);
        noteMapper.insert(note);
        return Result.success("创建成功", note);
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新笔记")
    public Result<Note> updateNote(@PathVariable String id, @RequestBody Note note) {
        note.setId(id);
        note.setUpdatedAt(LocalDateTime.now().toString());
        noteMapper.updateById(note);
        return Result.success("更新成功", noteMapper.selectById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除笔记")
    public Result<Void> deleteNote(@PathVariable String id) {
        noteMapper.deleteById(id);
        return Result.success("删除成功");
    }
}
