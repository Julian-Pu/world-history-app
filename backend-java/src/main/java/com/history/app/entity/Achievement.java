package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 成就表
 */
@Data
@TableName("achievements")
public class Achievement {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String badgeId;

    private String unlockedAt;
}
