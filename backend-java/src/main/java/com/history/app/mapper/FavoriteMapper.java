package com.history.app.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.history.app.entity.Favorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * Favorite Mapper
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {
}
