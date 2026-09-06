import { useMemo } from 'react';
import { Check } from 'lucide-react';
import type { HistoryEvent } from '@client/src/types/history';
import { getEraColor, formatYear } from '@client/src/data/eras';

interface TimelineTrackProps {
  events: HistoryEvent[];
  readEventIds: string[];
  minYear: number;
  totalYears: number;
  zoom: number;
  translateX: number;
  hasDragged: boolean;
  onEventClick: (event: HistoryEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  events,
  readEventIds,
  minYear,
  totalYears,
  zoom,
  translateX,
  hasDragged,
  onEventClick,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => {
  const trackWidth = useMemo(() => totalYears * zoom, [totalYears, zoom]);

  const getXPercent = (year: number): number =>
    ((year - minYear) / totalYears) * 100;

  // 计算时间轴刻度
  const { majorTicks, minorTicks } = useMemo(() => {
    const majors: { year: number; label: string; major: boolean }[] = [];
    const minors: { year: number }[] = [];

    // 根据缩放级别选择刻度间隔
    let majorStep = 1000;
    let minorStep = 500;
    if (zoom >= 50) {
      majorStep = 10;
      minorStep = 5;
    } else if (zoom >= 10) {
      majorStep = 100;
      minorStep = 50;
    } else if (zoom >= 2) {
      majorStep = 200;
      minorStep = 100;
    } else if (zoom >= 0.5) {
      majorStep = 500;
      minorStep = 250;
    }

    const start = Math.ceil(minYear / majorStep) * majorStep;
    for (let y = start; y <= minYear + totalYears; y += majorStep) {
      majors.push({ year: y, label: formatYear(y), major: true });
    }
    for (let y = Math.ceil(minYear / minorStep) * minorStep;
      y <= minYear + totalYears;
      y += minorStep) {
      if (y % majorStep !== 0) minors.push({ year: y });
    }

    return { majorTicks: majors, minorTicks: minors };
  }, [zoom, minYear, totalYears]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-card border border-border select-none"
      style={{ cursor: hasDragged ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 时间轴线容器 */}
      <div
        className="relative h-40 sm:h-48"
        style={{
          width: trackWidth,
          transform: `translateX(-${translateX}px)`,
        }}
      >
        {/* 背景时代色带 */}
        {/* 用 era 的起始和结束位置画色带 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-16 w-full bg-gradient-to-r from-era-ancient/10 via-era-medieval/10 to-era-modern/10"
          style={{ height: '60%', top: '20%' }}
        />

        {/* 主要刻度线（长） */}
        {majorTicks.map((tick) => (
          <div
            key={`major-${tick.year}`}
            className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${getXPercent(tick.year)}%` }}
          >
            <div className="h-6 w-px bg-border" />
            <div className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-1 whitespace-nowrap">
              {tick.label}
            </div>
            <div className="flex-1 w-px bg-border/40 mt-1" />
          </div>
        ))}

        {/* 次要刻度线（短） */}
        {minorTicks.map((tick) => (
          <div
            key={`minor-${tick.year}`}
            className="absolute top-0 flex items-start pointer-events-none"
            style={{ left: `${getXPercent(tick.year)}%`, height: '20%' }}
          >
            <div className="h-3 w-px bg-border/40" />
          </div>
        ))}

        {/* 中间主轴线 */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-foreground/30" />

        {/* 事件标记 */}
        {events.map((event) => {
          const xPercent = getXPercent(event.startYear);
          const eraColor = getEraColor(event.era);
          const isRead = readEventIds.includes(event.id);
          // 交替在轴线上下显示
          const isAbove =
            events.findIndex((e) => e.id === event.id) % 2 === 0;

          return (
            <button
              key={event.id}
              type="button"
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center group"
              style={{ left: `${xPercent}%`, width: '2rem', height: '2rem', marginLeft: '-1rem' }}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasDragged) onEventClick(event);
              }}
            >
              <div className="relative flex items-center justify-center w-full h-full">
                {isAbove && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center pb-1 pointer-events-none">
                    <div
                      className="px-2 py-1 text-[10px] sm:text-xs font-medium text-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20"
                      style={{ backgroundColor: eraColor }}
                    >
                      {event.title}
                    </div>
                    <div
                      className="w-px h-4 sm:h-6"
                      style={{ backgroundColor: eraColor }}
                    />
                  </div>
                )}

                {/* 圆点（中心轴线上） */}
                <div
                  className="relative w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125 z-10"
                  style={{ backgroundColor: eraColor }}
                >
                  {isRead && (
                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                  )}
                </div>

                {!isAbove && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pt-1 pointer-events-none">
                    <div
                      className="w-px h-4 sm:h-6"
                      style={{ backgroundColor: eraColor }}
                    />
                    <div
                      className="px-2 py-1 text-[10px] sm:text-xs font-medium text-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20"
                      style={{ backgroundColor: eraColor }}
                    >
                      {event.title}
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineTrack;
