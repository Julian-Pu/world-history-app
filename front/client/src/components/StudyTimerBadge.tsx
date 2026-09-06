import { Clock } from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const StudyTimerBadge: React.FC = () => {
  const todayTotalSeconds = useTimerStore((s) => s.todayTotalSeconds);
  const isRunning = useTimerStore((s) => s.isRunning);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-foreground">
          <Clock className={`w-4 h-4 ${isRunning ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-sm font-mono tabular-nums">
            {formatTime(todayTotalSeconds)}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>今日累计学习时长</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default StudyTimerBadge;
