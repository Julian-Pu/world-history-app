import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { EVENTS } from '@client/src/data/events';
import { getEraById, getRegionById, formatYear } from '@client/src/data/eras';
import { Badge } from '@client/src/components/ui/badge';

const HomeRecommended: React.FC = () => {
  const { difficulty } = useAppStore();
  const { readEvents } = useLearningStore();

  const recommended = useMemo(() => {
    // 推荐未读事件，按时期分布，优先推荐总进度较低的时期
    const unread = EVENTS.filter((ev) => !readEvents.includes(ev.id));
    if (unread.length === 0) {
      // 全部读完了，返回最早的3个作为复习
      return EVENTS.slice(0, 3);
    }
    // 按时期分组，每个时期取一个，保证多样性
    const byEra: Record<string, typeof EVENTS> = {};
    for (const ev of unread) {
      if (!byEra[ev.era]) byEra[ev.era] = [];
      byEra[ev.era].push(ev);
    }
    const picked: typeof EVENTS = [];
    const eraOrder = ['ancient', 'medieval', 'early-modern', 'industrial', 'modern'];
    for (const eraId of eraOrder) {
      const eraEvents = byEra[eraId];
      if (eraEvents && eraEvents.length > 0 && picked.length < 3) {
        picked.push(eraEvents[0]);
      }
    }
    // 不足3个时从剩下的补
    if (picked.length < 3) {
      for (const ev of unread) {
        if (!picked.includes(ev) && picked.length < 3) {
          picked.push(ev);
        }
      }
    }
    return picked;
  }, [readEvents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold text-foreground">今日推荐</h2>
        </div>
        <Link
          to="/timeline"
          className="text-sm text-primary hover:underline flex items-center gap-0.5"
        >
          全部事件
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommended.map((event) => {
          const era = getEraById(event.era);
          const region = getRegionById(event.region);
          const content = event.content[difficulty];
          return (
            <Link
              key={event.id}
              to={`/event/${event.id}`}
              className="group block rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 hover-elevate active-elevate"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: era?.color }}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {era?.name} · {formatYear(event.startYear)}
                </span>
              </div>
              <h3 className="font-serif font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {content.summary}
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal"
                  style={{ borderColor: region?.color + '40', color: region?.color }}
                >
                  {region?.name}
                </Badge>
                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  阅读
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HomeRecommended;
