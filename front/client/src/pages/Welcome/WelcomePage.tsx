import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Baby, GraduationCap, BookOpen, BookMarked } from 'lucide-react';
import { useAppStore } from '@client/src/store/useAppStore';
import { DIFFICULTY_LEVELS } from '@client/src/data/eras';
import type { Difficulty } from '@client/src/types/history';

const difficultyIcons: Record<Difficulty, React.ComponentType<{ className?: string }>> = {
  kindergarten: Baby,
  elementary: BookOpen,
  middle: BookMarked,
  high: GraduationCap,
};

const difficultyAges: Record<Difficulty, string> = {
  kindergarten: '3-6 岁',
  elementary: '7-12 岁',
  middle: '13-15 岁',
  high: '16-18 岁',
};

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { difficulty: storedDifficulty, setDifficulty } = useAppStore();
  const [selected, setSelected] = useState<Difficulty | null>(null);

  useEffect(() => {
    if (localStorage.getItem('welcome-shown') === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleStart = () => {
    if (!selected) return;
    setDifficulty(selected);
    localStorage.setItem('welcome-shown', 'true');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* 装饰背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-era-ancient/20 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
        {/* Logo */}
        <div className="w-20 h-20 mb-6 rounded-2xl bg-primary/10 flex items-center justify-center shadow-md">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>

        {/* 标题 */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4">
          世界历史学习
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-2 max-w-xl">
          穿越时空，探索人类文明的璀璨历程
        </p>
        <p className="text-sm text-muted-foreground/70 mb-10">
          从金字塔到太空时代，五千年历史尽在指尖
        </p>

        {/* 难度选择 */}
        <h2 className="text-xl font-serif font-semibold text-foreground mb-4">
          选择你的学习难度
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
          {DIFFICULTY_LEVELS.map((level) => {
            const Icon = difficultyIcons[level.id];
            const isSelected = selected === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setSelected(level.id)}
                className={`
                  relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-200
                  hover-elevate active-elevate
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/40'
                  }
                `}
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{level.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {level.description}
                </p>
                <span className="text-[10px] text-muted-foreground/60 px-2 py-0.5 rounded-full bg-secondary">
                  {difficultyAges[level.id]}
                </span>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <svg
                      className="w-4 h-4 text-primary-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 开始按钮 */}
        <button
          type="button"
          onClick={handleStart}
          disabled={!selected}
          className={`
            inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-lg shadow-md transition-all
            ${selected
              ? 'bg-primary text-primary-foreground hover-elevate active-elevate cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }
          `}
        >
          开始学习
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="mt-6 text-xs text-muted-foreground/60">
          选择后可随时在设置中调整难度
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
