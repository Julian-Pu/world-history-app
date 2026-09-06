package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.history.app.common.Result;
import com.history.app.common.UserContext;
import com.history.app.entity.Quiz;
import com.history.app.entity.QuizRecord;
import com.history.app.entity.WrongQuestion;
import com.history.app.mapper.QuizMapper;
import com.history.app.mapper.QuizRecordMapper;
import com.history.app.mapper.WrongQuestionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 测验模块（与 Node.js 版表结构一致）
 */
@RestController
@RequestMapping("/api/quizzes")
@Tag(name = "测验", description = "测验题目、提交、记录、错题本")
public class QuizzesController {

    @Autowired
    private QuizMapper quizMapper;

    @Autowired
    private QuizRecordMapper quizRecordMapper;

    @Autowired
    private WrongQuestionMapper wrongQuestionMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    @Operation(summary = "获取测验题目列表")
    public Result<Map<String, Object>> getQuizzes(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String era,
            @RequestParam(defaultValue = "10") Integer limit) {
        LambdaQueryWrapper<Quiz> wrapper = new LambdaQueryWrapper<>();
        if (level != null) wrapper.eq(Quiz::getLevel, level);
        if (era != null) wrapper.eq(Quiz::getPeriod, era);
        wrapper.last("ORDER BY RANDOM() LIMIT " + limit);
        List<Quiz> quizzes = quizMapper.selectList(wrapper);
        Map<String, Object> result = new HashMap<>();
        result.put("list", toQuizVOList(quizzes));
        return Result.success(result);
    }

    @GetMapping("/random")
    @Operation(summary = "获取随机测验")
    public Result<List<Map<String, Object>>> getRandomQuizzes(
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "10") Integer count) {
        LambdaQueryWrapper<Quiz> wrapper = new LambdaQueryWrapper<>();
        if (level != null) wrapper.eq(Quiz::getLevel, level);
        wrapper.last("ORDER BY RANDOM() LIMIT " + count);
        List<Quiz> quizzes = quizMapper.selectList(wrapper);
        return Result.success(toQuizVOList(quizzes));
    }

    @PostMapping("/submit")
    @Operation(summary = "提交测验")
    public Result<Map<String, Object>> submitQuiz(@RequestBody Map<String, Object> body) {
        String userId = UserContext.getUserId();
        String quizType = (String) body.getOrDefault("quiz_type", "random");
        String level = (String) body.get("level");
        Integer timeSpent = body.get("time_spent") != null ? ((Number) body.get("time_spent")).intValue() : 0;
        List<Map<String, Object>> answers = (List<Map<String, Object>>) body.get("answers");

        int correctCount = 0;
        List<Map<String, Object>> wrongQuestions = new ArrayList<>();

        for (Map<String, Object> ans : answers) {
            String questionId = (String) ans.get("question_id");
            Integer selectedOption = ans.get("selected_option") != null ? ((Number) ans.get("selected_option")).intValue() : -1;
            Quiz quiz = quizMapper.selectById(questionId);
            Integer correctAnswer = parseCorrectAnswer(quiz != null ? quiz.getCorrectAnswer() : null);
            if (quiz != null && correctAnswer != null && correctAnswer.equals(selectedOption)) {
                correctCount++;
            } else {
                wrongQuestions.add(ans);
                WrongQuestion wq = new WrongQuestion();
                wq.setUserId(userId);
                wq.setQuizId(questionId);
                wq.setMastered(0);
                try { wrongQuestionMapper.insert(wq); } catch (Exception e) { /* ignore duplicate */ }
            }
        }

        int total = answers.size();
        int score = total > 0 ? (correctCount * 100 / total) : 0;

        QuizRecord record = new QuizRecord();
        record.setUserId(userId);
        record.setQuizType(quizType);
        record.setLevel(level);
        record.setTotalQuestions(total);
        record.setCorrectCount(correctCount);
        record.setScore(score);
        record.setTimeSpent(timeSpent);
        record.setCreatedAt(LocalDateTime.now().toString());
        quizRecordMapper.insert(record);

        Map<String, Object> result = new HashMap<>();
        result.put("record_id", record.getId());
        result.put("total_questions", total);
        result.put("correct_count", correctCount);
        result.put("score", score);
        result.put("wrong_questions", wrongQuestions);
        return Result.success("测验提交成功", result);
    }

    @GetMapping("/records")
    @Operation(summary = "获取测验记录")
    public Result<Map<String, Object>> getRecords(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer limit) {
        String userId = UserContext.getUserId();
        LambdaQueryWrapper<QuizRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuizRecord::getUserId, userId);
        wrapper.orderByDesc(QuizRecord::getCreatedAt);
        Page<QuizRecord> pageResult = quizRecordMapper.selectPage(new Page<>(page, limit), wrapper);
        Map<String, Object> result = new HashMap<>();
        result.put("list", pageResult.getRecords());
        result.put("pagination", Map.of("page", pageResult.getCurrent(), "limit", pageResult.getSize(),
                "total", pageResult.getTotal(), "total_pages", pageResult.getPages()));
        return Result.success(result);
    }

    @GetMapping("/wrong-questions")
    @Operation(summary = "获取错题本")
    public Result<List<WrongQuestion>> getWrongQuestions() {
        String userId = UserContext.getUserId();
        return Result.success(wrongQuestionMapper.selectList(new LambdaQueryWrapper<WrongQuestion>()
                .eq(WrongQuestion::getUserId, userId)
                .eq(WrongQuestion::getMastered, 0)));
    }

    @PutMapping("/wrong-questions/{id}/master")
    @Operation(summary = "标记错题已掌握")
    public Result<Void> markMastered(@PathVariable String id) {
        WrongQuestion wq = wrongQuestionMapper.selectById(id);
        if (wq != null) {
            wq.setMastered(1);
            wrongQuestionMapper.updateById(wq);
        }
        return Result.success("已标记为掌握");
    }

    private List<Map<String, Object>> toQuizVOList(List<Quiz> quizzes) {
        return quizzes.stream().map(q -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", q.getId());
            item.put("level", q.getLevel());
            item.put("era", q.getPeriod());
            item.put("question", q.getQuestion());
            item.put("options", parseJsonArray(q.getOptions()));
            item.put("answer", parseCorrectAnswer(q.getCorrectAnswer()));
            item.put("explanation", q.getAnalysis());
            return item;
        }).collect(Collectors.toList());
    }

    private Integer parseCorrectAnswer(String answer) {
        if (answer == null || answer.isEmpty()) return null;
        try {
            return Integer.parseInt(answer.trim());
        } catch (Exception e) {
            // 可能是字母选项 A/B/C/D，转换为数字
            Map<String, Integer> letterMap = Map.of("A", 0, "B", 1, "C", 2, "D", 3);
            return letterMap.get(answer.trim().toUpperCase());
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
