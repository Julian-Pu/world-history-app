import {
  BookOpen,
  Award,
  Flame,
  Clock,
} from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { EVENTS } from '@client/src/data/events';

interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const HomeOverview: React.FC = () => {
  const { readEvents, quizRecords, streakDays, totalStudyMinutes } = useLearningStore();

  const totalEvents = EVENTS.length;
  const completedQuizzes = quizRecords.length;
  const hours = Math.floor(totalStudyMinutes / 60);
  const minutes = totalStudyMinutes % 60;

  const stats: StatItem[] = [
    {
      label: '已读事件',
      value: `${readEvents.length} / ${totalEvents}`,
      icon: BookOpen,
      color: 'text-era-ancient',
      bgColor: 'bg-era-ancient/10',
    },
    {
      label: '测验完成',
      value: `${completedQuizzes} 次`,
      icon: Award,
      color: 'text-era-industrial',
      bgColor: 'bg-era-industrial/10',
    },
    {
      label: '连续学习',
      value: `${streakDays} 天`,
      icon: Flame,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: '累计时长',
      value: hours > 0 ? `${hours}h ${minutes}m` : `${minutes} 分钟`,
      icon: Clock,
      color: 'text-era-modern',
      bgColor: 'bg-era-modern/10',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        学习概览
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold text-foreground mb-0.5">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeOverview;
