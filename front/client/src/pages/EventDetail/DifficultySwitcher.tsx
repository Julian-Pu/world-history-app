import { DIFFICULTY_LEVELS } from '@client/src/data/eras';
import type { Difficulty } from '@client/src/types/history';

interface DifficultySwitcherProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

const DifficultySwitcher: React.FC<DifficultySwitcherProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="inline-flex items-center p-1 rounded-full bg-secondary/60 border border-border">
      {DIFFICULTY_LEVELS.map((level) => (
        <button
          key={level.id}
          onClick={() => onChange(level.id)}
          className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${
            value === level.id
              ? 'bg-primary text-primary-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {level.name}
        </button>
      ))}
    </div>
  );
};

export default DifficultySwitcher;
