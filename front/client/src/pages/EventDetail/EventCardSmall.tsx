import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getEraById, getRegionById, formatYearRange } from '@client/src/data/eras';
import type { HistoryEvent } from '@client/src/types/history';

interface EventCardSmallProps {
  event: HistoryEvent;
}

const EventCardSmall: React.FC<EventCardSmallProps> = ({ event }) => {
  const eraInfo = getEraById(event.era);
  const regionInfo = getRegionById(event.region);

  return (
    <Link
      to={`/event/${event.id}`}
      className="shrink-0 w-56 sm:w-64 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-2">
        {eraInfo && (
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: eraInfo.color }}
          />
        )}
        <span className="text-xs text-muted-foreground">
          {formatYearRange(event.startYear, event.endYear)}
        </span>
      </div>
      <h4 className="font-serif font-semibold text-foreground mb-1 line-clamp-2">
        {event.title}
      </h4>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {regionInfo && <span>{regionInfo.name}</span>}
        <ChevronRight className="w-3 h-3 ml-auto text-primary" />
      </div>
    </Link>
  );
};

export default EventCardSmall;
