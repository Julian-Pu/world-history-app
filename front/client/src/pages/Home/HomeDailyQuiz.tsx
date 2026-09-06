import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dices, ChevronRight } from 'lucide-react';
import { useAppStore } from '@client/src/store/useAppStore';
import { QUIZ_QUESTIONS } from '@client/src/data/quizzes';
import { Badge } from '@client/src/components/ui/badge';

// 用日期作为种子生成当日3道题
function seededPick<T>(arr: T[], seed: number, count: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  let s = seed;
  while (result.length < count && result.length < arr.length) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * arr.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
}

const HomeDailyQuiz: React.FC = () => {
  const { difficulty } = useAppStore();

  const dailyQuestions = useMemo(() => {
    const todaySeed = parseInt(
      new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      10,
    );
    const difficultyQuestions = QUIZ_QUESTIONS.filter((q) => q.difficulty === difficulty);
    return seededPick(difficultyQuestions, todaySeed, 3);
  }, [difficulty]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold text-foreground">每日一练</h2>
          <Badge variant="secondary" className="text-[10px] font-normal">
            每日更新
          </Badge>
        </div>
      </div>

      <Link
        to="/quiz/play?mode=daily"
        className="group block rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover-elevate active-elevate"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">今日 3 道题</p>
            <p className="font-serif font-semibold text-foreground">
              来挑战一下你的历史知识吧！
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
            3
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {dailyQuestions.map((q, i: number) => (
            <div
              key={q.id}
              className="flex items-center gap-3 text-sm p-2 rounded-lg bg-card/60"
            >
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground/80 line-clamp-1 text-xs md:text-sm">
                {q.question}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            完成后可查看解析和错题记录
          </span>
          <span className="text-sm font-medium text-primary flex items-center gap-0.5 group-hover:gap-1 transition-all">
            开始答题
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </div>
  );
};

export default HomeDailyQuiz;
