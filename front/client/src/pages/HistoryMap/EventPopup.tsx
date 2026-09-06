import { X, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EVENTS } from '../../data/events';
import { formatYearRange, getEraById, getRegionById } from '../../data/eras';
import { useAppStore } from '../../store/useAppStore';
import type { Difficulty } from '../../types/history';

interface EventPopupProps {
  eventId: string | null;
  onClose: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ eventId, onClose }) => {
  const navigate = useNavigate();
  const difficulty = useAppStore((s) => s.difficulty);

  if (!eventId) return null;

  const event = EVENTS.find((e) => e.id === eventId);
  if (!event) return null;

  const era = getEraById(event.era);
  const region = getRegionById(event.region);
  const content = event.content[difficulty as Difficulty];

  const handleViewDetail = (): void => {
    navigate(`/event/${event.id}`);
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-64 bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      {/* 顶部色条 */}
      <div className="h-2" style={{ backgroundColor: '#CD5C5C' }} />

      <div className="p-4">
        {/* 标题栏 */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-serif font-bold text-base text-foreground leading-tight">
            {event.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 信息项 */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatYearRange(event.startYear, event.endYear)}</span>
          </div>

          {era && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: era.color }}
              />
              <span className="text-muted-foreground">{era.name}</span>
            </div>
          )}

          {region && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* 事件摘要 */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {content?.summary ?? ''}
          </p>
        </div>

        {/* 查看详情按钮 */}
        <button
          onClick={handleViewDetail}
          className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          查看详情
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EventPopup;
