import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Clock,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { EVENTS } from '@client/src/data/events';
import { ERAS } from '@client/src/data/eras';
import type { HistoryEvent, EraId, RegionId, Difficulty } from '@client/src/types/history';
import { useStudyTimerPage } from '@client/src/hooks/useStudyTimer';
import { useTimelinePanZoom } from './useTimelinePanZoom';
import TimelineTrack from './TimelineTrack';
import EventPreviewDialog from './EventPreviewDialog';
import FilterPanel from './FilterPanel';

const TimelinePage: React.FC = () => {
  useStudyTimerPage();
  const { difficulty } = useAppStore();
  const { readEvents } = useLearningStore();
  const navigate = useNavigate();

  const viewportRef = useRef<HTMLDivElement>(null);

  // 筛选状态
  const [selectedEras, setSelectedEras] = useState<EraId[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<RegionId[]>([]);
  const [filterDifficulty, setFilterDifficulty] =
    useState<Difficulty>(difficulty);

  // 预览弹窗
  const [previewEvent, setPreviewEvent] = useState<HistoryEvent | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  // 计算时间轴范围
  const { minYear, maxYear, totalYears } = useMemo(() => {
    const min = Math.min(...EVENTS.map((e) => e.startYear));
    const max = Math.max(...EVENTS.map((e) => e.endYear));
    // 加一点padding
    const padding = Math.max(100, (max - min) * 0.05);
    return {
      minYear: Math.floor((min - padding) / 100) * 100,
      maxYear: Math.ceil((max + padding) / 100) * 100,
      totalYears:
        Math.ceil((max + padding) / 100) * 100 -
        Math.floor((min - padding) / 100) * 100,
    };
  }, []);

  const {
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
  } = useTimelinePanZoom({ totalYears, viewportRef });

  // 筛选后的事件
  const filteredEvents = useMemo(() => {
    return EVENTS.filter((ev) => {
      if (selectedEras.length > 0 && !selectedEras.includes(ev.era))
        return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(ev.region))
        return false;
      return true;
    });
  }, [selectedEras, selectedRegions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedEras.length > 0) count++;
    if (selectedRegions.length > 0) count++;
    if (filterDifficulty !== difficulty) count++;
    return count;
  }, [selectedEras, selectedRegions, filterDifficulty, difficulty]);

  const handleEraToggle = (eraId: EraId) => {
    setSelectedEras((prev) =>
      prev.includes(eraId)
        ? prev.filter((id) => id !== eraId)
        : [...prev, eraId],
    );
  };

  const handleRegionToggle = (regionId: RegionId) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((id) => id !== regionId)
        : [...prev, regionId],
    );
  };

  const handleResetFilters = () => {
    setSelectedEras([]);
    setSelectedRegions([]);
    setFilterDifficulty(difficulty);
  };

  const handleEventClick = (event: HistoryEvent) => {
    setPreviewEvent(event);
    setPreviewOpen(true);
  };

  const handleGoSearch = () => {
    navigate('/search');
  };

  const zoomLabel = useMemo(() => {
    const z = ZOOM_LEVELS[zoomLevel];
    if (z >= 50) return '年';
    if (z >= 10) return '十年';
    if (z >= 2) return '百年';
    if (z >= 0.5) return '五百年';
    return '千年';
  }, [zoomLevel, ZOOM_LEVELS]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              历史时间线
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              拖拽浏览，滚轮缩放，探索五千年文明长河
            </p>
          </div>
        </div>
      </div>

      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <FilterPanel
          selectedEras={selectedEras}
          selectedRegions={selectedRegions}
          selectedDifficulty={filterDifficulty}
          onEraToggle={handleEraToggle}
          onRegionToggle={handleRegionToggle}
          onDifficultyChange={setFilterDifficulty}
          onReset={handleResetFilters}
          activeFilterCount={activeFilterCount}
        />

        <div className="flex items-center gap-1 bg-card border border-border rounded-md p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            className="h-8 w-8"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
            {zoomLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            className="h-8 w-8"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={resetView}
            className="h-8 w-8"
            title="重置视图"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGoSearch}
          className="ml-auto"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">搜索</span>
        </Button>
      </div>

      {/* 筛选状态提示 */}
      {filteredEvents.length !== EVENTS.length && (
        <div className="text-xs text-muted-foreground">
          筛选结果：{filteredEvents.length} / {EVENTS.length} 个事件
        </div>
      )}

      {/* 时间线主体 */}
      <div
        ref={viewportRef}
        className="w-full min-h-[200px] sm:min-h-[240px] touch-none"
      >
        <TimelineTrack
          events={filteredEvents}
          readEventIds={readEvents}
          minYear={minYear}
          totalYears={totalYears}
          zoom={zoom}
          translateX={translateX}
          hasDragged={hasDragged}
          onEventClick={handleEventClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* 时期图例 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">时期图例：</span>
        {ERAS.map((era) => (
          <div key={era.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: era.color }}
            />
            <span>{era.name}</span>
          </div>
        ))}
      </div>

      {/* 操作提示 */}
      <div className="text-xs text-muted-foreground text-center">
        💡 拖动时间线可左右平移 · 滚轮/双指捏合可缩放 · 点击圆点查看事件
      </div>

      {/* 事件预览弹窗 */}
      <EventPreviewDialog
        event={previewEvent}
        difficulty={filterDifficulty}
        isRead={previewEvent ? readEvents.includes(previewEvent.id) : false}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
};

export default TimelinePage;
