import { useEffect, useRef } from 'react';
import { useTimerStore } from '../store/useTimerStore';

export function useStudyTimerPage(): void {
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const tick = useTimerStore((s) => s.tick);
  const isRunning = useTimerStore((s) => s.isRunning);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 页面进入启动，卸载暂停
  useEffect(() => {
    start();

    // 全局 tick 定时器（单例管理：只在 isRunning 时累计）
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听页面可见性
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        pause();
      } else {
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [start, pause]);

  // 避免未使用警告
  void isRunning;
}
