package com.history.app.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;


/**
 * 历史事件表（与 Node.js 版表结构一致）
 */
@Data
@TableName("events")
public class Event {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String titleEn;

    private String startDate;

    private String endDate;

    private String location;

    private String region;

    private String period;

    private String category;

    private String levelContents;

    private String relatedPeople;

    private String relatedEvents;

    private String tags;

    private String imageUrl;

    private String createdAt;

    private String updatedAt;
}
