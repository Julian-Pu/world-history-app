package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 学习时长记录表（与 Node.js 版表结构一致）
 */
@Data
@TableName("study_sessions")
public class StudySession {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String startTime;

    private String endTime;

    private Integer duration;

    private String contentType;

    private String contentId;

    private String createdAt;
}
