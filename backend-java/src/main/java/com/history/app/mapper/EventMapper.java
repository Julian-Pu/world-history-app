package com.history.app.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.history.app.entity.Event;
import org.apache.ibatis.annotations.Mapper;

/**
 * Event Mapper
 */
@Mapper
public interface EventMapper extends BaseMapper<Event> {
}
