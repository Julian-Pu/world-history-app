import { Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@client/src/components/ui/sheet';
import { Button } from '@client/src/components/ui/button';
import { ERAS, REGIONS, DIFFICULTY_LEVELS } from '@client/src/data/eras';
import type { EraId, RegionId, Difficulty } from '@client/src/types/history';

interface FilterPanelProps {
  selectedEras: EraId[];
  selectedRegions: RegionId[];
  selectedDifficulty: Difficulty;
  onEraToggle: (eraId: EraId) => void;
  onRegionToggle: (regionId: RegionId) => void;
  onDifficultyChange: (d: Difficulty) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedEras,
  selectedRegions,
  selectedDifficulty,
  onEraToggle,
  onRegionToggle,
  onDifficultyChange,
  onReset,
  activeFilterCount,
}) => {
  const trigger = (
    <Button variant="outline" size="sm" className="relative">
      <Filter className="w-4 h-4" />
      <span className="hidden sm:inline">筛选</span>
      {activeFilterCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[85vw] sm:w-96 p-0">
        <SheetHeader className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-lg">筛选条件</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              重置
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 时期筛选 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              历史时期
            </h3>
            <div className="flex flex-wrap gap-2">
              {ERAS.map((era) => {
                const selected = selectedEras.includes(era.id);
                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => onEraToggle(era.id)}
                    className="relative px-3 py-1.5 rounded-md text-xs font-medium transition-all border"
                    style={{
                      backgroundColor: selected ? `${era.color}15` : 'transparent',
                      borderColor: selected ? era.color : 'var(--border)',
                      color: selected ? era.color : 'var(--muted-foreground)',
                    }}
                  >
                    {era.name}
                    {selected && (
                      <X className="inline w-3 h-3 ml-1 -mr-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 地区筛选 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              地区
            </h3>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => {
                const selected = selectedRegions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => onRegionToggle(region.id)}
                    className="relative px-3 py-1.5 rounded-md text-xs font-medium transition-all border"
                    style={{
                      backgroundColor: selected
                        ? `${region.color}15`
                        : 'transparent',
                      borderColor: selected
                        ? region.color
                        : 'var(--border)',
                      color: selected
                        ? region.color
                        : 'var(--muted-foreground)',
                    }}
                  >
                    {region.name}
                    {selected && (
                      <X className="inline w-3 h-3 ml-1 -mr-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 难度筛选 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              内容难度
            </h3>
            <div className="space-y-2">
              {DIFFICULTY_LEVELS.map((level) => {
                const selected = selectedDifficulty === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => onDifficultyChange(level.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="text-sm font-medium">{level.name}</div>
                    <div className="text-xs mt-0.5 opacity-80">
                      {level.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterPanel;
