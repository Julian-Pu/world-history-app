package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 收藏表
 */
@Data
@TableName("favorites")
public class Favorite {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String contentType;

    private String contentId;

    private String createdAt;
}
