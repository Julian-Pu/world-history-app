import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Map, Info, ChevronLeft, ChevronRight, ArrowLeft, Star } from 'lucide-react';
import { Slider } from '@client/src/components/ui/slider';
import { Button } from '@client/src/components/ui/button';
import WorldMap, { type WorldMapHandle } from './WorldMap';
import MapLegend from './MapLegend';
import MapControls from './MapControls';
import CivilizationPopup from './CivilizationPopup';
import EventPopup from './EventPopup';
import {
  MAP_CIVILIZATIONS,
  getCivilizationsAtYear,
  getEventMarkersForDifficulty,
} from '../../data/map-data';
import { EVENTS } from '../../data/events';
import { ERAS, formatYear } from '../../data/eras';
import { useAppStore } from '../../store/useAppStore';
import type { MapCivilization, EraId, Difficulty } from '../../types/history';
import { useStudyTimerPage } from '@client/src/hooks/useStudyTimer';

const YEAR_MIN = -3500;
const YEAR_MAX = 2024;

// 幼儿园难度只显示主要的 8 个文明
const KINDERGARTEN_CIV_IDS = [
  'egypt-old',
  'rome-empire',
  'qin-han',
  'mongol',
  'tang',
  'british-empire',
  'usa',
  'prc',
];

const HistoryMapPage: React.FC = () => {
  useStudyTimerPage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const difficulty: Difficulty = useAppStore((s) => s.difficulty);
  const mapRef = useRef<WorldMapHandle | null>(null);

  const eventId = searchParams.get('eventId');

  const [currentYear, setCurrentYear] = useState<number>(-500);
  const [selectedCiv, setSelectedCiv] = useState<MapCivilization | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState<boolean>(true);
  const [showTerritories, setShowTerritories] = useState<boolean>(true);

  const currentEraId: EraId | null = useMemo(() => {
    const era = ERAS.find(
      (e) => currentYear >= e.startYear && currentYear <= e.endYear,
    );
    return era ? era.id : null;
  }, [currentYear]);

  // 根据难度过滤文明
  const visibleCivilizations: MapCivilization[] = useMemo(() => {
    const allAtYear = getCivilizationsAtYear(currentYear);
    if (difficulty === 'kindergarten') {
      return allAtYear.filter((c: MapCivilization) =>
        KINDERGARTEN_CIV_IDS.includes(c.id),
      );
    }
    return allAtYear;
  }, [currentYear, difficulty]);

  // 根据难度获取事件 marker
  const eventMarkers = useMemo(() => {
    const allMarkers = getEventMarkersForDifficulty(difficulty);
    // 只显示当前年份前后 200 年范围内的事件
    return allMarkers.filter((m) => {
      const evt = EVENTS.find((e) => e.id === m.eventId);
      if (!evt) return false;
      return currentYear >= evt.startYear - 50 && currentYear <= evt.endYear + 50;
    });
  }, [difficulty, currentYear]);

  // 从事件跳转过来的联动逻辑
  useEffect(() => {
    if (!eventId) return;

    const event = EVENTS.find((e) => e.id === eventId);
    if (!event) return;

    const targetYear = event.startYear;
    setCurrentYear(targetYear);

    // 找到同一时期同一地区的文明进行高亮
    const matchedCiv = MAP_CIVILIZATIONS.find(
      (c) =>
        c.era === event.era &&
        c.region === event.region &&
        targetYear >= c.startYear &&
        targetYear <= c.endYear,
    );
    if (matchedCiv) {
      setHighlightedId(matchedCiv.id);
      setSelectedCiv(matchedCiv);
    }
    // 同时选中事件
    setSelectedEventId(eventId);
  }, [eventId]);

  const handleSliderChange = (value: number[]): void => {
    setCurrentYear(value[0]);
    setSelectedCiv(null);
    setHighlightedId(null);
    setSelectedEventId(null);
  };

  const handleEraClick = (eraId: EraId): void => {
    const era = ERAS.find((e) => e.id === eraId);
    if (!era) return;
    const midYear = Math.round((era.startYear + era.endYear) / 2);
    setCurrentYear(midYear);
    setSelectedCiv(null);
    setHighlightedId(null);
    setSelectedEventId(null);
  };

  const handleYearStep = (direction: -1 | 1, step: number): void => {
    const next = Math.max(
      YEAR_MIN,
      Math.min(YEAR_MAX, currentYear + direction * step),
    );
    setCurrentYear(next);
    setSelectedCiv(null);
    setHighlightedId(null);
    setSelectedEventId(null);
  };

  const handleBack = (): void => {
    if (eventId) {
      navigate(`/event/${eventId}`);
    } else {
      navigate(-1);
    }
  };

  const handleClearEventParam = (): void => {
    setHighlightedId(null);
    setSelectedCiv(null);
    setSelectedEventId(null);
    searchParams.delete('eventId');
    setSearchParams(searchParams, { replace: true });
  };

  const handleEventClick = (evtId: string): void => {
    setSelectedEventId(evtId);
    setSelectedCiv(null);
  };

  const handleCivClick = (civ: MapCivilization): void => {
    setSelectedCiv(civ);
    setSelectedEventId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[600px] lg:h-[calc(100vh-10rem)]">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {eventId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              返回事件
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl text-foreground">
                历史地图
              </h1>
              <p className="text-xs text-muted-foreground">
                拖动时间轴，探索不同时期的文明分布
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm flex-wrap">
          {/* 事件标注开关 */}
          {difficulty !== 'kindergarten' && (
            <Button
              variant={showEvents ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowEvents((v) => !v)}
              className="gap-1.5"
            >
              <Star
                className="w-4 h-4"
                fill={showEvents ? 'currentColor' : 'none'}
              />
              事件标注
            </Button>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              当前显示 {visibleCivilizations.length} 个文明
              {eventMarkers.length > 0 && ` · ${eventMarkers.length} 个事件`}
            </span>
          </div>
        </div>
      </div>

      {/* 事件联动提示 */}
      {eventId && highlightedId && (
        <div className="mb-3 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between shrink-0">
          <p className="text-sm text-foreground">
            已定位到事件所在年代：
            <span className="font-semibold text-primary">
              {' '}{formatYear(currentYear)}
            </span>
          </p>
          <Button variant="ghost" size="sm" onClick={handleClearEventParam}>
            清除高亮
          </Button>
        </div>
      )}

      {/* 地图区域 */}
      <div className="relative flex-1 min-h-[300px] h-[60vh] lg:h-[70vh] rounded-xl overflow-hidden border-2 border-[#8B7355] shadow-lg shrink-0">
        <div className="absolute inset-0">
          <WorldMap
            civilizations={visibleCivilizations}
            highlightedId={highlightedId}
            onCivClick={handleCivClick}
            eventMarkers={eventMarkers}
            showEvents={showEvents}
            showTerritories={showTerritories}
            difficulty={difficulty}
            onEventClick={handleEventClick}
            mapRef={mapRef}
          />
        </div>

        {/* 图例 */}
        {difficulty !== 'kindergarten' && <MapLegend />}

        {/* 缩放控制 */}
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onReset={() => mapRef.current?.reset()}
        />

        {/* 文明信息弹窗 */}
        <CivilizationPopup
          civilization={selectedCiv}
          onClose={() => setSelectedCiv(null)}
        />

        {/* 事件弹窗 */}
        <EventPopup
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />

        {/* 当前年份徽章 */}
        <div className="absolute top-4 left-4 px-4 py-2 bg-card/95 backdrop-blur-sm rounded-lg shadow-md border border-border">
          <div className="text-xs text-muted-foreground mb-0.5">当前年份</div>
          <div className="font-serif font-bold text-xl text-foreground">
            {formatYear(currentYear)}
          </div>
        </div>
      </div>

      {/* 底部控制区 - 深色背景 */}
      <div className="mt-4 bg-[#2C1810] rounded-xl p-4 md:p-5 text-[#FBF6E9] shrink-0">
        {/* 时期快速选择按钮 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ERAS.map((era) => {
            const isActive = currentEraId === era.id;
            return (
              <button
                key={era.id}
                onClick={() => handleEraClick(era.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-md scale-105'
                    : 'bg-[#3D2817] text-[#D4C4A8] hover:bg-[#4A3020] hover:text-white'
                }`}
                style={
                  isActive ? { backgroundColor: era.color } : undefined
                }
              >
                {era.name}
              </button>
            );
          })}
        </div>

        {/* 时间滑块 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleYearStep(-1, 100)}
            className="text-[#D4C4A8] hover:text-white hover:bg-[#3D2817] shrink-0"
            aria-label="后退100年"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            {/* 时期刻度背景条 */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-1.5 rounded-full overflow-hidden flex">
              {ERAS.map((era) => {
                const widthPct =
                  ((era.endYear - era.startYear) /
                    (YEAR_MAX - YEAR_MIN)) *
                  100;
                return (
                  <div
                    key={era.id}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: era.color,
                      opacity: 0.4,
                    }}
                  />
                );
              })}
            </div>

            <Slider
              value={[currentYear]}
              min={YEAR_MIN}
              max={YEAR_MAX}
              step={1}
              onValueChange={handleSliderChange}
              className="relative z-10"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleYearStep(1, 100)}
            className="text-[#D4C4A8] hover:text-white hover:bg-[#3D2817] shrink-0"
            aria-label="前进100年"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* 当前年份显示 */}
          <div className="hidden sm:flex flex-col items-end min-w-[90px] shrink-0">
            <span className="text-xs text-[#8B7355]">年份</span>
            <span className="font-serif font-bold text-lg text-primary">
              {formatYear(currentYear)}
            </span>
          </div>
        </div>

        {/* 刻度年份标签 */}
        <div className="flex justify-between mt-2 px-8 text-xs text-[#8B7355]">
          <span>前3500</span>
          <span>前2000</span>
          <span>前500</span>
          <span>1000</span>
          <span>1500</span>
          <span>1900</span>
          <span>2024</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryMapPage;
