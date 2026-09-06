import { useCallback, useEffect, useRef, useState } from 'react';

export interface TimelinePanZoomState {
  zoom: number;
  translateX: number;
  zoomLevel: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 100;
const ZOOM_LEVELS = [0.1, 0.5, 2, 10, 50];
// 0=千年级(0.1 px/year) 1=百年级 2=十年级 3=年级 4=精细

interface UseTimelinePanZoomOptions {
  totalYears: number;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

export function useTimelinePanZoom({
  totalYears,
  viewportRef,
}: UseTimelinePanZoomOptions) {
  const [zoom, setZoom] = useState<number>(ZOOM_LEVELS[0]);
  const [translateX, setTranslateX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartX = useRef<number>(0);
  const dragStartTranslate = useRef<number>(0);
  const dragMovedPixels = useRef<number>(0);
  const touchStartDistance = useRef<number>(0);
  const touchStartZoom = useRef<number>(zoom);
  const touchStartTranslate = useRef<number>(0);
  const touchStartCenterX = useRef<number>(0);

  // 计算当前缩放等级（0~4）
  const zoomLevel = ZOOM_LEVELS.reduce(
    (best: number, lv: number, idx: number) =>
      Math.abs(zoom - lv) < Math.abs(zoom - ZOOM_LEVELS[best]) ? idx : best,
    0,
  );

  const clampTranslate = useCallback(
    (tx: number, z: number): number => {
      const viewportWidth = viewportRef.current?.clientWidth ?? 800;
      const trackWidth = totalYears * z;
      const maxTx = Math.max(0, trackWidth - viewportWidth);
      return Math.max(0, Math.min(maxTx, tx));
    },
    [totalYears, viewportRef],
  );

  const zoomAtPoint = useCallback(
    (clientX: number, newZoom: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const pointX = clientX - rect.left;
      const yearAtPoint = (pointX + translateX) / zoom;
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      const newTx = yearAtPoint * clampedZoom - pointX;
      setZoom(clampedZoom);
      setTranslateX(clampTranslate(newTx, clampedZoom));
    },
    [translateX, zoom, viewportRef, clampTranslate],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      zoomAtPoint(e.clientX, zoom * factor);
    },
    [zoom, zoomAtPoint],
  );

  // 鼠标拖动
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragMovedPixels.current = 0;
      dragStartX.current = e.clientX;
      dragStartTranslate.current = translateX;
    },
    [translateX],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = dragStartX.current - e.clientX;
      dragMovedPixels.current = Math.max(dragMovedPixels.current, Math.abs(dx));
      setTranslateX(clampTranslate(dragStartTranslate.current + dx, zoom));
    },
    [isDragging, zoom, clampTranslate],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸拖动 & 双指缩放
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        setIsDragging(true);
        dragMovedPixels.current = 0;
        dragStartX.current = e.touches[0].clientX;
        dragStartTranslate.current = translateX;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
        touchStartZoom.current = zoom;
        touchStartTranslate.current = translateX;
        touchStartCenterX.current =
          (e.touches[0].clientX + e.touches[1].clientX) / 2;
      }
    },
    [translateX, zoom],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = dragStartX.current - e.touches[0].clientX;
        dragMovedPixels.current = Math.max(dragMovedPixels.current, Math.abs(dx));
        setTranslateX(clampTranslate(dragStartTranslate.current + dx, zoom));
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const ratio = distance / touchStartDistance.current;
        const newZoom = touchStartZoom.current * ratio;
        const viewport = viewportRef.current;
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const pointX = touchStartCenterX.current - rect.left;
        const yearAtPoint =
          (pointX + touchStartTranslate.current) / touchStartZoom.current;
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        const newTx = yearAtPoint * clampedZoom - pointX;
        setZoom(clampedZoom);
        setTranslateX(clampTranslate(newTx, clampedZoom));
      }
    },
    [isDragging, zoom, clampTranslate, viewportRef],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全局 mouse 事件监听
  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // wheel 监听
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const listener = (e: WheelEvent) => handleWheel(e);
    el.addEventListener('wheel', listener, { passive: false });
    return () => el.removeEventListener('wheel', listener);
  }, [handleWheel, viewportRef]);

  // 缩放控制按钮
  const zoomIn = useCallback(() => {
    const nextIdx = Math.min(ZOOM_LEVELS.length - 1, zoomLevel + 1);
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cx = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    zoomAtPoint(cx, ZOOM_LEVELS[nextIdx]);
  }, [zoomLevel, zoomAtPoint, viewportRef]);

  const zoomOut = useCallback(() => {
    const prevIdx = Math.max(0, zoomLevel - 1);
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cx = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    zoomAtPoint(cx, ZOOM_LEVELS[prevIdx]);
  }, [zoomLevel, zoomAtPoint, viewportRef]);

  const resetView = useCallback(() => {
    setZoom(ZOOM_LEVELS[0]);
    setTranslateX(0);
  }, []);

  // 判断是否发生过实际拖动（用于区分点击和拖动）
  const hasDragged = dragMovedPixels.current > 5;

  return {
    zoom,
    translateX,
    zoomLevel,
    isDragging,
    hasDragged,
    zoomIn,
    zoomOut,
    resetView,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    ZOOM_LEVELS,
  };
}
