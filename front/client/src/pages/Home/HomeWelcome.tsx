import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Sunrise, Sparkles } from 'lucide-react';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { DIFFICULTY_LEVELS, getEraColor } from '@client/src/data/eras';
import { EVENTS } from '@client/src/data/events';
import { Badge } from '@client/src/components/ui/badge';

const HomeWelcome: React.FC = () => {
  const { difficulty } = useAppStore();
  const { readEvents, studyCalendar, totalStudyMinutes, streakDays } = useLearningStore();

  const difficultyLevel = DIFFICULTY_LEVELS.find((d) => d.id === difficulty);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayProgress = studyCalendar[todayKey] ?? { minutes: 0, eventsRead: 0 };
  const todayGoal = 15; // 每日目标 15 分钟
  const todayPercent = Math.min(100, Math.round((todayProgress.minutes / todayGoal) * 100));

  const totalEvents = EVENTS.length;
  const overallPercent = Math.round((readEvents.length / totalEvents) * 100);

  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: '夜深了', icon: Moon, color: 'text-era-modern' };
    if (hour < 12) return { text: '早上好', icon: Sunrise, color: 'text-era-industrial' };
    if (hour < 18) return { text: '下午好', icon: Sun, color: 'text-primary' };
    return { text: '晚上好', icon: Moon, color: 'text-era-modern' };
  }, []);

  const GreetingIcon = greetingInfo.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 md:p-8 border border-border shadow-sm">
      {/* 装饰 */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <GreetingIcon className={`w-5 h-5 ${greetingInfo.color}`} />
            <span className="text-sm font-medium text-muted-foreground">
              {greetingInfo.text}，欢迎回来
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
            今天也要一起探索历史哦
            <Sparkles className="inline-block w-6 h-6 ml-2 text-era-industrial" />
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              当前难度：{difficultyLevel?.name ?? '小学'}
            </Badge>
            <Link
              to="/settings"
              className="text-xs text-primary hover:underline"
            >
              切换难度 →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:w-72">
          {/* 今日进度 */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">今日学习</span>
              <span className="font-medium text-foreground">
                {todayProgress.minutes} / {todayGoal} 分钟
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-era-industrial transition-all duration-500"
                style={{ width: `${todayPercent}%` }}
              />
            </div>
          </div>

          {/* 总体进度 */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">总体进度</span>
              <span className="font-medium text-foreground">
                {readEvents.length} / {totalEvents} 个事件
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-era-ancient via-era-industrial to-era-modern transition-all duration-500"
                style={{
                  width: `${overallPercent}%`,
                  background: `linear-gradient(to right, ${getEraColor('ancient')}, ${getEraColor('industrial')}, ${getEraColor('modern')})`,
                }}
              />
            </div>
          </div>

          {/* 连续学习 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">🔥 连续</span>
              <span className="font-semibold text-foreground">{streakDays} 天</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">⏱️ 累计</span>
              <span className="font-semibold text-foreground">
                {Math.floor(totalStudyMinutes / 60)}小时{totalStudyMinutes % 60}分
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeWelcome;
