package com.history.app.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.history.app.entity.Note;
import org.apache.ibatis.annotations.Mapper;

/**
 * Note Mapper
 */
@Mapper
public interface NoteMapper extends BaseMapper<Note> {
}
