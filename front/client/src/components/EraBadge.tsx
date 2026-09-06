import { Badge } from '@/components/ui/badge';
import { ERAS } from '@client/src/data/eras';
import type { EraId } from '@client/src/types/history';

interface EraBadgeProps {
  eraId: EraId;
  className?: string;
}

const EraBadge: React.FC<EraBadgeProps> = ({ eraId, className }) => {
  const era = ERAS.find((e) => e.id === eraId);
  if (!era) return null;

  return (
    <Badge
      variant="outline"
      className={className}
      style={{
        backgroundColor: `${era.color}15`,
        borderColor: `${era.color}40`,
        color: era.color,
      }}
    >
      {era.name}
    </Badge>
  );
};

export { EraBadge };
