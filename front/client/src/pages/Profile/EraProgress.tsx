import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { ERAS } from '@client/src/data/eras';
import { EVENTS } from '@client/src/data/events';

const EraProgress: React.FC = () => {
  const navigate = useNavigate();
  const getEraProgress = useLearningStore((state) => state.getEraProgress);
  const readEvents = useLearningStore((state) => state.readEvents);

  const handleEraClick = (eraId: string) => {
    navigate(`/timeline?era=${eraId}`);
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-card border border-border shadow-sm">
      <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full"></span>
        学习进度
      </h2>

      <div className="space-y-4">
        {ERAS.map((era) => {
          const progress = getEraProgress(era.id);
          const eraEventsCount = readEvents.filter(
            (id: string) =>
              EVENTS.find((e) => e.id === id)?.era === era.id,
          ).length;
          const totalInEra = EVENTS.filter((e) => e.era === era.id).length;

          return (
            <button
              key={era.id}
              onClick={() => handleEraClick(era.id)}
              className="w-full text-left group p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--era-${era.id})` }}
                  />
                  <span className="font-medium text-foreground text-sm sm:text-base">
                    {era.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {eraEventsCount}/{totalInEra}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold" style={{ color: `var(--era-${era.id})` }}>
                    {progress}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: `var(--era-${era.id})`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        点击时期可跳转至时间线查看详情
      </p>
    </div>
  );
};

export default EraProgress;
