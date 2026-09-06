import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { EVENTS } from '@client/src/data/events';
import { getEraById, formatYear } from '@client/src/data/eras';

const HomeRecent: React.FC = () => {
  const { difficulty } = useAppStore();
  const { readEvents } = useLearningStore();

  const recentEvents = useMemo(() => {
    // 取最近阅读的3个（目前 store 没有阅读时间，按已读列表顺序取最后3个）
    const recentIds = readEvents.slice(-3).reverse();
    return recentIds
      .map((id) => EVENTS.find((e) => e.id === id))
      .filter(Boolean) as typeof EVENTS;
  }, [readEvents]);

  if (readEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold text-foreground">最近学习</h2>
        </div>
        <Link
          to="/timeline"
          className="text-sm text-primary hover:underline flex items-center gap-0.5"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
        {recentEvents.map((event) => {
          const era = getEraById(event.era);
          const content = event.content[difficulty];
          return (
            <Link
              key={event.id}
              to={`/event/${event.id}`}
              className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors group"
            >
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: era?.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {event.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {era?.name} · {formatYear(event.startYear)} · {content.summary.slice(0, 30)}...
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HomeRecent;
