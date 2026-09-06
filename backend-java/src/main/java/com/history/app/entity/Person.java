package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 历史人物表
 */
@Data
@TableName("people")
public class Person {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    private String dynasty;

    private String region;

    private String role;

    private String birthYear;

    private String deathYear;

    private String levelContents;
}
