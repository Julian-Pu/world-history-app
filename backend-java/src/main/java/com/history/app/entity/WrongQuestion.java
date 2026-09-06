package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 错题本表（与 Node.js 版表结构一致）
 */
@Data
@TableName("wrong_questions")
public class WrongQuestion {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String quizId;

    private String userAnswer;

    private Integer wrongCount;

    private String lastWrongAt;

    private Integer mastered;
}
