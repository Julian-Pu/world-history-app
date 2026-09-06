import type { StateStorage } from 'zustand/middleware';

// 内存存储作为 localStorage 不可用时的降级方案
const memoryStorage: Record<string, string> = {};

/**
 * 安全的 storage 包装器
 * 在 localStorage 不可用时（隐私模式、Safari 限制等）自动降级到内存存储
 * 避免应用因 localStorage 访问异常而崩溃
 */
export const safeStorage: StateStorage = {
  getItem: (name: string) => {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(name);
    } catch (e) {
      console.warn('[safeStorage] getItem failed, using memory storage:', e);
      return memoryStorage[name] ?? null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (typeof localStorage === 'undefined') throw new Error('localStorage is undefined');
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('[safeStorage] setItem failed, using memory storage:', e);
      memoryStorage[name] = value;
    }
  },
  removeItem: (name: string) => {
    try {
      if (typeof localStorage === 'undefined') throw new Error('localStorage is undefined');
      localStorage.removeItem(name);
    } catch (e) {
      console.warn('[safeStorage] removeItem failed:', e);
      delete memoryStorage[name];
    }
  },
};
