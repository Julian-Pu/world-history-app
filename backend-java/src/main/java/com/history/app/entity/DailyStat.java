package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 每日统计表（与 Node.js 版表结构一致）
 */
@Data
@TableName("daily_stats")
public class DailyStat {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String date;

    private Integer studyDuration;

    private Integer eventsRead;

    private Integer quizzesTaken;

    private Integer quizzesCorrect;

    private Integer notesCreated;
}
