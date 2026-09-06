import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_LEVELS } from '@client/src/data/eras';
import type { Difficulty } from '@client/src/types/history';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; border: string; text: string }> = {
  kindergarten: {
    bg: 'hsl(322, 85%, 95%)',
    border: 'hsl(322, 60%, 80%)',
    text: 'hsl(322, 70%, 40%)',
  },
  elementary: {
    bg: 'hsl(142, 65%, 93%)',
    border: 'hsl(142, 45%, 75%)',
    text: 'hsl(142, 70%, 30%)',
  },
  middle: {
    bg: 'hsl(217, 85%, 93%)',
    border: 'hsl(217, 55%, 78%)',
    text: 'hsl(217, 70%, 35%)',
  },
  high: {
    bg: 'hsl(0, 65%, 93%)',
    border: 'hsl(0, 50%, 78%)',
    text: 'hsl(0, 65%, 40%)',
  },
};

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className }) => {
  const level = DIFFICULTY_LEVELS.find((d) => d.id === difficulty);
  const colors = DIFFICULTY_COLORS[difficulty];
  if (!level) return null;

  return (
    <Badge
      variant="outline"
      className={className}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {level.name}
    </Badge>
  );
};

export { DifficultyBadge };
