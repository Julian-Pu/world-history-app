import { Link } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';
import { formatYear } from '@client/src/data/eras';
import type { HistoricalFigure } from '@client/src/types/history';

interface FigureCardProps {
  figure: HistoricalFigure;
}

const FigureCard: React.FC<FigureCardProps> = ({ figure }) => {
  return (
    <Link
      to={`/figure/${figure.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-serif font-semibold text-foreground truncate">
          {figure.name}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {formatYear(figure.birthYear)} - {formatYear(figure.deathYear)}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
};

export default FigureCard;
