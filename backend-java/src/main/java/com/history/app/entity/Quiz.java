package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 测验题库表（与 Node.js 版表结构一致）
 */
@Data
@TableName("quizzes")
public class Quiz {

    @TableId(type = IdType.INPUT)
    private String id;

    private String question;

    private String type;

    private String options;

    private String correctAnswer;

    private String analysis;

    private String level;

    private String period;

    private String region;

    private String category;

    private String relatedEventId;

    private Integer difficulty;

    private String createdAt;
}
