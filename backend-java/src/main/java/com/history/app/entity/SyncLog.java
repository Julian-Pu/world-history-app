package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 同步日志表（与 Node.js 版表结构一致）
 */
@Data
@TableName("sync_log")
public class SyncLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String userId;

    private String entityType;

    private String entityId;

    private String operation;

    private String payload;

    private String timestamp;
}
