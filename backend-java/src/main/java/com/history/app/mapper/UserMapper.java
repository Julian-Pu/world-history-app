package com.history.app.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.history.app.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * User Mapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
