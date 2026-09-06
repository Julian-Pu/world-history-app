package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;


/**
 * 用户表
 */
@Data
@TableName("users")
public class User {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String username;

    private String email;

    @JsonIgnore
    private String passwordHash;

    private String defaultLevel;

    private String storageMode;

    private String theme;

    private String fontSize;

    private String createdAt;

    private String updatedAt;

    private String lastSyncAt;
}
