import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { ERAS, formatYearRange } from '@client/src/data/eras';
import { EVENTS } from '@client/src/data/events';

const HomeEraProgress: React.FC = () => {
  const navigate = useNavigate();
  const { getEraProgress } = useLearningStore();

  const handleEraClick = (eraId: string) => {
    navigate(`/timeline?era=${eraId}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        时期进度
      </h2>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        {ERAS.map((era) => {
          const progress = getEraProgress(era.id);
          const totalInEra = EVENTS.filter((e) => e.era === era.id).length;
          const readInEra = Math.round((progress / 100) * totalInEra);

          return (
            <button
              key={era.id}
              type="button"
              onClick={() => handleEraClick(era.id)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: era.color }}
                  />
                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {era.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {readInEra}/{totalInEra}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: era.color }}
                  >
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                  style={{ width: `${progress}%`, backgroundColor: era.color }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {formatYearRange(era.startYear, era.endYear)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeEraProgress;
