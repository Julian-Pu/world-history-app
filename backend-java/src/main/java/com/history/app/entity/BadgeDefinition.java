package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 徽章定义表
 */
@Data
@TableName("badge_definitions")
public class BadgeDefinition {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String name;

    private String description;

    private String category;

    private String condition;

    private String icon;
}
