package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 测验记录表
 */
@Data
@TableName("quiz_records")
public class QuizRecord {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String quizType;

    private String level;

    private Integer totalQuestions;

    private Integer correctCount;

    private Integer score;

    private Integer timeSpent;

    private String createdAt;
}
