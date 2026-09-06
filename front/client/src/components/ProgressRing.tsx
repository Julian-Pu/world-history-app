import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 200,
  strokeWidth = 12,
  className,
  label,
  sublabel,
  color = 'hsl(45, 89%, 38%)',
  trackColor = 'hsl(44, 35%, 88%)',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clampedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label !== undefined && (
          <span
            className="font-serif font-bold text-foreground"
            style={{ fontSize: size * 0.2 }}
          >
            {label}
          </span>
        )}
        {sublabel !== undefined && (
          <span className="text-sm text-muted-foreground mt-1">{sublabel}</span>
        )}
      </div>
    </div>
  );
};

export { ProgressRing };
