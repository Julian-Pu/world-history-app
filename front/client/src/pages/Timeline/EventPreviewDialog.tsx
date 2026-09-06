import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import type { HistoryEvent, Difficulty } from '@client/src/types/history';
import {
  getEraById,
  getRegionById,
  formatYearRange,
} from '@client/src/data/eras';

interface EventPreviewDialogProps {
  event: HistoryEvent | null;
  difficulty: Difficulty;
  isRead: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventPreviewDialog: React.FC<EventPreviewDialogProps> = ({
  event,
  difficulty,
  isRead,
  open,
  onOpenChange,
}) => {
  if (!event) return null;

  const era = getEraById(event.era);
  const region = getRegionById(event.region);
  const content = event.content[difficulty];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* 顶部色带 */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: era?.color ?? '#6B7280' }}
        />

        <div className="p-6">
          <DialogHeader className="text-left">
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="font-serif text-xl text-foreground">
                {event.title}
              </DialogTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {era && (
                <Badge
                  className="text-xs border-transparent"
                  style={{
                    backgroundColor: `${era.color}15`,
                    color: era.color,
                  }}
                >
                  {era.name}
                </Badge>
              )}
              {region && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: `${region.color}40`,
                    color: region.color,
                  }}
                >
                  {region.name}
                </Badge>
              )}
              {isRead && (
                <Badge variant="secondary" className="text-xs">
                  已读
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatYearRange(event.startYear, event.endYear)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-foreground leading-relaxed">
              {content.summary}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              当前难度：
              {difficulty === 'kindergarten'
                ? '幼儿园'
                : difficulty === 'elementary'
                ? '小学'
                : difficulty === 'middle'
                ? '初中'
                : '高中'}
            </span>
            <Button asChild size="sm">
              <Link to={`/event/${event.id}`}>
                查看详情
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventPreviewDialog;
