package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 刷新令牌表
 */
@Data
@TableName("refresh_tokens")
public class RefreshToken {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String token;

    private String expiresAt;

    private String createdAt;
}
