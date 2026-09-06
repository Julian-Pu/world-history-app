import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Home,
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ProgressRing';
import { EraBadge } from '@/components/EraBadge';
import { formatTime } from '@client/src/utils/quiz';
import { ERAS } from '@client/src/data/eras';
import type { QuizQuestion, QuizRecord, EraId } from '@client/src/types/history';

interface AnswerRecord {
  questionId: string;
  answer: string | boolean | null;
  correct: boolean | null;
}

interface ResultPageState {
  record: Omit<QuizRecord, 'id'>;
  questions: QuizQuestion[];
  answers: AnswerRecord[];
  fromWrongBook?: boolean;
}

const QuizResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultPageState | null;

  const [expandedWrong, setExpandedWrong] = useState<Set<string>>(new Set());

  const record = state?.record;
  const questions = state?.questions ?? [];
  const answers = state?.answers ?? [];
  const fromWrongBook = state?.fromWrongBook ?? false;

  const wrongQuestions = useMemo(() => {
    const wrong: { question: QuizQuestion; userAnswer: string | boolean | null }[] = [];
    answers.forEach((a, idx) => {
      if (a.correct === false && questions[idx]) {
        wrong.push({ question: questions[idx], userAnswer: a.answer });
      }
    });
    return wrong;
  }, [answers, questions]);

  const eraStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number }> = {};
    questions.forEach((q, idx) => {
      const era = q.era;
      if (!stats[era]) stats[era] = { total: 0, correct: 0 };
      stats[era].total += 1;
      if (answers[idx]?.correct) stats[era].correct += 1;
    });
    return Object.entries(stats).map(([eraId, s]) => ({
      eraId,
      ...s,
      accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0,
    }));
  }, [questions, answers]);

  const typeStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number }> = {};
    const typeLabels: Record<string, string> = {
      choice: '选择题',
      judge: '判断题',
      material: '材料题',
      'image-choice': '图片题',
      'short-answer': '简答题',
    };
    questions.forEach((q, idx) => {
      const type = q.type;
      if (!stats[type]) stats[type] = { total: 0, correct: 0 };
      stats[type].total += 1;
      if (answers[idx]?.correct) stats[type].correct += 1;
    });
    return Object.entries(stats).map(([type, s]) => ({
      type,
      label: typeLabels[type] ?? type,
      ...s,
      accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0,
    }));
  }, [questions, answers]);

  const weakEras = useMemo(() => {
    return eraStats
      .filter((e) => e.total >= 1 && e.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [eraStats]);

  const toggleWrongExpand = (id: string) => {
    setExpandedWrong((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRetry = () => {
    navigate('/quiz/play', {
      state: {
        questions,
        title: `${record?.title}（再测一次）`,
        quizId: 'retry',
        isWrongBook: fromWrongBook,
      },
    });
  };

  const handleBackToList = () => {
    navigate('/quiz');
  };

  const handleWrongBook = () => {
    navigate('/quiz/wrong');
  };

  // 没有数据时返回
  if (!record || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-serif font-bold text-foreground mb-2">
          暂无测验结果
        </h2>
        <p className="text-muted-foreground mb-6">请先完成一次测验</p>
        <Button onClick={handleBackToList}>
          <Home className="w-4 h-4" />
          返回测验列表
        </Button>
      </div>
    );
  }

  const accuracy = record.accuracy;
  const rankPercentile = Math.max(5, Math.min(95, Math.round(accuracy * 0.9 + 10)));
  const isPerfect = accuracy === 100;
  const isGood = accuracy >= 80;

  const scoreColor = isPerfect
    ? 'hsl(142, 76%, 36%)'
    : isGood
    ? 'hsl(45, 89%, 38%)'
    : accuracy >= 60
    ? 'hsl(38, 92%, 50%)'
    : 'hsl(0, 56%, 58%)';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 成绩展示区 */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* 进度环 */}
            <div className="shrink-0">
              <ProgressRing
                value={accuracy}
                size={200}
                strokeWidth={14}
                color={scoreColor}
                label={`${Math.round(accuracy)}分`}
                sublabel="正确率"
              />
            </div>

            {/* 成绩详情 */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  {isPerfect ? '🎉 满分通过！' : isGood ? '👏 表现不错！' : '💪 继续加油！'}
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">{record.title}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                    <Target className="w-3.5 h-3.5" /> 答对题数
                  </div>
                  <div className="text-xl font-serif font-bold text-foreground">
                    {record.correctCount}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{record.totalQuestions}
                    </span>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" /> 用时
                  </div>
                  <div className="text-xl font-serif font-bold text-foreground">
                    {formatTime(record.timeSpent)}
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 排名
                  </div>
                  <div className="text-xl font-serif font-bold text-foreground">
                    前{rankPercentile}%
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                    <Award className="w-3.5 h-3.5" /> 错题
                  </div>
                  <div className="text-xl font-serif font-bold text-foreground">
                    {wrongQuestions.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 各时期正确率 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              各时期正确率
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eraStats.map((stat) => {
              const era = ERAS.find((e) => e.id === stat.eraId);
              return (
                <div key={stat.eraId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <EraBadge eraId={stat.eraId as EraId} />
                    </span>
                    <span className="text-foreground font-medium">
                      {Math.round(stat.accuracy)}% ({stat.correct}/{stat.total})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${stat.accuracy}%`,
                        backgroundColor: era?.color ?? 'var(--primary)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 各题型正确率 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              各题型正确率
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeStats.map((stat) => (
              <div key={stat.type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground">{stat.label}</span>
                  <span className="text-foreground font-medium">
                    {Math.round(stat.accuracy)}% ({stat.correct}/{stat.total})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 薄弱知识点 */}
      {weakEras.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="w-5 h-5" />
              薄弱时期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weakEras.map((stat) => (
                <div
                  key={stat.eraId}
                  className="flex items-center gap-2 bg-card/80 rounded-lg px-3 py-2"
                >
                  <EraBadge eraId={stat.eraId as EraId} />
                  <span className="text-sm text-foreground">
                    正确率 {Math.round(stat.accuracy)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              建议多复习这些时期的历史事件，巩固薄弱环节
            </p>
          </CardContent>
        </Card>
      )}

      {/* 错题回顾 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            错题回顾
            <Badge variant="outline" className="ml-auto">
              共 {wrongQuestions.length} 道
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wrongQuestions.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="text-muted-foreground">太棒了！本次没有错题 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wrongQuestions.map(({ question, userAnswer }) => {
                const isExpanded = expandedWrong.has(question.id);
                return (
                  <div
                    key={question.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleWrongExpand(question.id)}
                      className="w-full p-3 flex items-start gap-3 text-left hover:bg-secondary/50 transition-colors"
                    >
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <span className="flex-1 text-sm text-foreground line-clamp-2">
                        {question.question}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-border/50 bg-secondary/30">
                        <div className="pt-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-destructive font-medium shrink-0">
                              你的答案：
                            </span>
                            <span className="text-destructive">
                              {userAnswer === true
                                ? '正确'
                                : userAnswer === false
                                ? '错误'
                                : String(userAnswer)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-success font-medium shrink-0">
                              正确答案：
                            </span>
                            <span className="text-success">
                              {question.correctAnswer === true
                                ? '正确'
                                : question.correctAnswer === false
                                ? '错误'
                                : String(question.correctAnswer)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-medium shrink-0">
                              解析：
                            </span>
                            <span className="text-foreground/80">
                              {question.explanation}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant="outline" size="lg" onClick={handleBackToList}>
          <Home className="w-4 h-4" />
          返回列表
        </Button>
        <Button variant="secondary" size="lg" onClick={handleWrongBook}>
          <BookOpen className="w-4 h-4" />
          查看错题本
        </Button>
        <Button size="lg" onClick={handleRetry}>
          <RotateCcw className="w-4 h-4" />
          再测一次
        </Button>
      </div>
    </div>
  );
};

export default QuizResultPage;
