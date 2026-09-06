import { Clock, BookOpen, CheckCircle, Target } from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { EVENTS } from '@client/src/data/events';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  accentColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  accentColor,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground mb-0.5 truncate">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground font-serif">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileStats: React.FC = () => {
  const { readEvents, quizRecords, totalStudyMinutes } = useLearningStore();

  const totalEvents = EVENTS.length;
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyMinutesRemain = totalStudyMinutes % 60;

  // 计算平均正确率
  const avgAccuracy =
    quizRecords.length > 0
      ? Math.round(
          quizRecords.reduce(
            (sum: number, r) => sum + r.accuracy,
            0,
          ) / quizRecords.length,
        )
      : 0;

  const stats: StatCardProps[] = [
    {
      icon: Clock,
      label: '累计学习时长',
      value: `${studyHours} 小时`,
      subValue: studyHours > 0 ? `${studyMinutesRemain} 分钟` : '开始你的历史之旅吧',
      accentColor: 'hsl(45, 89%, 38%)',
    },
    {
      icon: BookOpen,
      label: '已读事件',
      value: `${readEvents.length} / ${totalEvents}`,
      subValue: `完成度 ${Math.round((readEvents.length / totalEvents) * 100)}%`,
      accentColor: 'hsl(30, 76%, 31%)',
    },
    {
      icon: CheckCircle,
      label: '测验完成数',
      value: `${quizRecords.length} 次`,
      subValue: quizRecords.length > 0 ? '继续挑战更多测验' : '还没有测验记录',
      accentColor: 'hsl(152, 50%, 35%)',
    },
    {
      icon: Target,
      label: '平均正确率',
      value: `${avgAccuracy}%`,
      subValue: avgAccuracy >= 80 ? '成绩优秀！' : '再接再厉',
      accentColor: 'hsl(262, 52%, 52%)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat: StatCardProps, index: number) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default ProfileStats;
