import { useState } from 'react';
import { Lock, Check } from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { ACHIEVEMENTS } from '@client/src/data/achievements';
import { EVENTS } from '@client/src/data/events';
import type { Achievement } from '@client/src/types/history';

const ProfileAchievements: React.FC = () => {
  const { achievements, readEvents, notes, streakDays, quizRecords } =
    useLearningStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getProgress = (ach: Achievement): { current: number; total: number; text: string } => {
    const isUnlocked = achievements.includes(ach.id);

    if (isUnlocked) {
      return { current: 1, total: 1, text: '已解锁' };
    }

    switch (ach.condition.type) {
      case 'events-read':
        return {
          current: Math.min(readEvents.length, ach.condition.value),
          total: ach.condition.value,
          text: `已读 ${readEvents.length}/${ach.condition.value} 个事件`,
        };
      case 'streak-days':
        return {
          current: Math.min(streakDays, ach.condition.value),
          total: ach.condition.value,
          text: `连续 ${streakDays}/${ach.condition.value} 天`,
        };
      case 'notes-count':
        return {
          current: Math.min(notes.length, ach.condition.value),
          total: ach.condition.value,
          text: `笔记 ${notes.length}/${ach.condition.value} 篇`,
        };
      case 'quiz-perfect':
        return {
          current: quizRecords.some((r) => r.accuracy === 100) ? 1 : 0,
          total: 1,
          text: '在测验中获得满分',
        };
      case 'era-complete': {
        const eraId = ach.condition.eraId;
        if (!eraId) return { current: 0, total: 1, text: '' };
        const totalInEra = EVENTS.filter((e) => e.era === eraId).length;
        const readInEra = readEvents.filter(
          (id) => EVENTS.find((e) => e.id === id)?.era === eraId,
        ).length;
        return {
          current: readInEra,
          total: totalInEra,
          text: `已读 ${readInEra}/${totalInEra} 个事件`,
        };
      }
      default:
        return { current: 0, total: 1, text: '' };
    }
  };

  const unlockedCount = achievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full"></span>
          成就徽章
        </h2>
        <span className="text-sm text-muted-foreground">
          已解锁{' '}
          <span className="font-bold text-primary">{unlockedCount}</span> /{' '}
          {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = achievements.includes(ach.id);
          const progress = getProgress(ach);
          const progressPct =
            progress.total > 0
              ? Math.min(100, Math.round((progress.current / progress.total) * 100))
              : 0;
          const isHovered = hoveredId === ach.id;

          return (
            <div
              key={ach.id}
              onMouseEnter={() => setHoveredId(ach.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative p-3 sm:p-4 rounded-xl border transition-all duration-300 cursor-default ${
                isUnlocked
                  ? 'bg-gradient-to-br from-primary/5 to-transparent border-primary/30 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'
                  : 'bg-muted/30 border-border hover:border-muted-foreground/30 grayscale opacity-70 hover:opacity-90'
              }`}
            >
              {/* 图标 */}
              <div className="flex justify-center mb-2">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-transform duration-300 ${
                    isHovered && isUnlocked ? 'scale-110' : ''
                  }`}
                  style={{
                    backgroundColor: isUnlocked
                      ? 'hsl(45, 89%, 38%, 0.15)'
                      : 'hsl(24, 15%, 36%, 0.1)',
                  }}
                >
                  {ach.icon}
                </div>
              </div>

              {/* 名称 */}
              <h3 className="text-center text-sm font-semibold text-foreground mb-1">
                {ach.name}
              </h3>

              {/* 描述 - 悬停时显示 */}
              <p
                className={`text-xs text-center text-muted-foreground mb-2 line-clamp-2 transition-all duration-200 ${
                  isHovered ? 'opacity-100' : 'opacity-0 h-0 mb-0'
                }`}
              >
                {ach.description}
              </p>

              {/* 状态标签 / 进度条 */}
              {isUnlocked ? (
                <div className="flex items-center justify-center gap-1 text-xs text-primary font-medium">
                  <Check className="w-3.5 h-3.5" />
                  已解锁
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-muted-foreground/40 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span className="truncate">{progress.text}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileAchievements;
