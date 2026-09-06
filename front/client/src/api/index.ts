import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

/**
 * API 命名空间导出结构
 * 各命名空间后续填充具体接口实现
 */

export const history = {
  // 历史内容相关 API（events / figures / eras / regions）
  // 待后续实现
};

export const user = {
  // 用户相关 API（登录 / 注册 / 信息）
  // 待后续实现
};

export const sync = {
  // 云端数据同步 API（上传 / 下载 / 冲突处理）
  // 待后续实现
};

// 保留 logger 与 axiosForBackend 引用，供各命名空间内的函数使用
export { logger, axiosForBackend };
