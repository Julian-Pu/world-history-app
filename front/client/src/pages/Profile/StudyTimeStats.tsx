import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Clock, Calendar, CalendarDays, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { useLearningStore } from '@client/src/store/useLearningStore';

const PRIMARY_COLOR = '#B8860B';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${PRIMARY_COLOR}15`, color: PRIMARY_COLOR }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground mb-0.5 truncate">{label}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground font-serif truncate">
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {subValue}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  }
  return `${minutes}分钟`;
}

function getDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(getDateKey(d));
  }
  return days;
}

function getMonthDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i += 1) {
    const d = new Date(year, month, i);
    days.push(getDateKey(d));
  }
  return days;
}

const StudyTimeStats: React.FC = () => {
  const studyCalendar = useLearningStore((s) => s.studyCalendar);
  const totalStudyMinutes = useLearningStore((s) => s.totalStudyMinutes);

  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const todayKey = getDateKey(new Date(now));
    const todayMinutes = studyCalendar[todayKey]?.minutes ?? 0;

    const last7Days = getLast7Days();
    const weekMinutes = last7Days.reduce(
      (sum: number, key: string) => sum + (studyCalendar[key]?.minutes ?? 0),
      0,
    );

    const monthDays = getMonthDays();
    const monthMinutes = monthDays.reduce(
      (sum: number, key: string) => sum + (studyCalendar[key]?.minutes ?? 0),
      0,
    );

    return {
      today: todayMinutes,
      week: weekMinutes,
      month: monthMinutes,
      total: totalStudyMinutes,
    };
  }, [studyCalendar, totalStudyMinutes, now]);

  const chartData = useMemo(() => {
    const days = getLast7Days();
    return days.map((key: string) => ({
      date: key.slice(5), // MM-DD
      minutes: studyCalendar[key]?.minutes ?? 0,
    }));
  }, [studyCalendar]);

  const chartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown): string => {
        const arr = params as { name: string; value: number }[];
        if (!arr || arr.length === 0) return '';
        const p = arr[0];
        return `${p.name}<br/>学习时长：${p.value} 分钟`;
      },
    },
    grid: {
      bottom: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.date),
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#6B5B4F', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: '#6B5B4F', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B5B4F', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0e6d2', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: chartData.map((d) => d.minutes),
        barMaxWidth: 32,
        itemStyle: {
          color: PRIMARY_COLOR,
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: { color: '#DAA520' },
        },
      },
    ],
  };

  const statCards: StatCardProps[] = [
    {
      icon: Clock,
      label: '今日学习',
      value: formatDuration(stats.today),
      subValue: stats.today > 0 ? '继续保持！' : '开始今日学习',
    },
    {
      icon: CalendarDays,
      label: '本周学习',
      value: formatDuration(stats.week),
      subValue: '近7天累计',
    },
    {
      icon: Calendar,
      label: '本月学习',
      value: formatDuration(stats.month),
      subValue: '当月累计',
    },
    {
      icon: Award,
      label: '总学习时长',
      value: formatDuration(stats.total),
      subValue: '累计所有学习',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
          学习时长统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat: StatCardProps, index: number) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">最近7天学习趋势</h4>
          <div className="h-[280px]">
            <ReactECharts
              option={chartOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyTimeStats;
