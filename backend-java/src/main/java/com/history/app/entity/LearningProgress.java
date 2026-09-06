package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 学习进度表
 */
@Data
@TableName("learning_progress")
public class LearningProgress {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String contentType;

    private String contentId;

    private String status;

    private String level;

    private Integer timeSpent;

    private String firstReadAt;

    private String completedAt;
}
