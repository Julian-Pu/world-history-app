package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 人物关系表
 */
@Data
@TableName("person_relations")
public class PersonRelation {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String personId;

    private String relatedPersonId;

    private String relationType;

    private String description;

    private String startYear;

    private String endYear;
}
