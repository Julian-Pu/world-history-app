package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 笔记表
 */
@Data
@TableName("notes")
public class Note {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String contentType;

    private String contentId;

    private String title;

    private String content;

    private String tags;

    private String createdAt;

    private String updatedAt;

    @TableLogic
    private Integer deleted;
}
