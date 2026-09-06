import { useMemo, useState } from 'react';
import { useLearningStore } from '@client/src/store/useLearningStore';

interface DayData {
  date: string;
  dayOfWeek: number; // 0=周日, 6=周六
  weekIndex: number;
  minutes: number;
  eventsRead: number;
  isCurrentMonth: boolean;
  monthLabel?: string;
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const StudyCalendar: React.FC = () => {
  const studyCalendar = useLearningStore((state) => state.studyCalendar);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { weeks, monthLabels, totalDays, totalMinutes, activeDays } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    // 往前推 26 周（约 6 个月），从周一开始对齐
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 26 * 7);
    // 对齐到周日
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: DayData[] = [];
    const current = new Date(startDate);
    let weekIndex = 0;
    let activeCount = 0;
    let totalMins = 0;

    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      const calendarData = studyCalendar[dateStr];
      const minutes = calendarData?.minutes ?? 0;
      const eventsRead = calendarData?.eventsRead ?? 0;

      if (minutes > 0) {
        activeCount++;
        totalMins += minutes;
      }

      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 && days.length > 0) {
        weekIndex++;
      }

      let monthLabel: string | undefined;
      if (current.getDate() <= 7) {
        monthLabel = MONTH_NAMES[current.getMonth()];
      }

      days.push({
        date: dateStr,
        dayOfWeek,
        weekIndex,
        minutes,
        eventsRead,
        isCurrentMonth: current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear(),
        monthLabel,
      });

      current.setDate(current.getDate() + 1);
    }

    // 按周分组
    const weekCount = weekIndex + 1;
    const weekArray: DayData[][] = Array.from({ length: weekCount }, () => []);
    for (const day of days) {
      weekArray[day.weekIndex].push(day);
    }

    // 提取月份标签（每周第一个有 label 的）
    const mLabels: { weekIndex: number; label: string }[] = [];
    for (let i = 0; i < weekArray.length; i++) {
      const firstWithLabel = weekArray[i].find((d) => d.monthLabel);
      if (firstWithLabel && firstWithLabel.dayOfWeek <= 3) {
        mLabels.push({ weekIndex: i, label: firstWithLabel.monthLabel! });
      }
    }

    return {
      weeks: weekArray,
      monthLabels: mLabels,
      totalDays: days.length,
      totalMinutes: totalMins,
      activeDays: activeCount,
    };
  }, [studyCalendar]);

  // 根据学习时长返回颜色强度等级 (0-4)
  const getIntensityLevel = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes < 10) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  };

  const getCellColor = (level: number): string => {
    switch (level) {
      case 0:
        return 'bg-muted/40';
      case 1:
        return 'bg-primary/30';
      case 2:
        return 'bg-primary/50';
      case 3:
        return 'bg-primary/70';
      case 4:
        return 'bg-primary';
      default:
        return 'bg-muted/40';
    }
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full"></span>
          学习日历
        </h2>
        <div className="text-sm text-muted-foreground">
          本学期学习 <span className="font-bold text-primary">{activeDays}</span> 天
        </div>
      </div>

      {/* 日历热力图 */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-fit">
          {/* 月份标签行 */}
          <div className="flex gap-[3px] ml-6 mb-1 text-xs text-muted-foreground">
            {Array.from({ length: weeks.length }, (_, i) => {
              const label = monthLabels.find((m) => m.weekIndex === i);
              return (
                <div
                  key={i}
                  className="w-[11px] sm:w-[13px] text-center"
                >
                  {label ? label.label : ''}
                </div>
              );
            })}
          </div>

          {/* 日期网格 */}
          <div className="flex gap-1">
            {/* 星期标签 */}
            <div className="flex flex-col gap-[3px] text-xs text-muted-foreground w-5">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="h-[11px] sm:h-[13px] flex items-center justify-end pr-1"
                >
                  {i % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* 周列 */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {WEEKDAY_LABELS.map((_, dayIdx) => {
                    const day = week.find((d) => d.dayOfWeek === dayIdx);
                    if (!day) {
                      return (
                        <div
                          key={dayIdx}
                          className="w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] rounded-sm"
                        />
                      );
                    }
                    const level = getIntensityLevel(day.minutes);
                    return (
                      <div
                        key={dayIdx}
                        className={`w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] rounded-sm ${getCellColor(
                          level,
                        )} transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50`}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={
                          day.minutes > 0
                            ? `${formatDate(day.date)}：学习 ${day.minutes} 分钟`
                            : `${formatDate(day.date)}：未学习`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
            <span>少</span>
            <div className="w-[11px] h-[11px] rounded-sm bg-muted/40" />
            <div className="w-[11px] h-[11px] rounded-sm bg-primary/30" />
            <div className="w-[11px] h-[11px] rounded-sm bg-primary/50" />
            <div className="w-[11px] h-[11px] rounded-sm bg-primary/70" />
            <div className="w-[11px] h-[11px] rounded-sm bg-primary" />
            <span>多</span>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground font-serif">
            {activeDays}
          </p>
          <p className="text-xs text-muted-foreground">活跃天数</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="text-xl font-bold text-foreground font-serif">
            {Math.floor(totalMinutes / 60)}h
          </p>
          <p className="text-xs text-muted-foreground">累计学习</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground font-serif">
            {totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0}%
          </p>
          <p className="text-xs text-muted-foreground">坚持率</p>
        </div>
      </div>
    </div>
  );
};

export default StudyCalendar;
