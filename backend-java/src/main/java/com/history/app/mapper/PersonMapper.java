package com.history.app.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.history.app.entity.Person;
import org.apache.ibatis.annotations.Mapper;

/**
 * Person Mapper
 */
@Mapper
public interface PersonMapper extends BaseMapper<Person> {
}
