import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Grid3X3,
  AlertTriangle,
  CheckCircle2,
  Circle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { useStudyTimerPage } from '@client/src/hooks/useStudyTimer';
import { QuestionCard } from './QuestionCard';
import { formatTime, isAnswerCorrect } from '@client/src/utils/quiz';
import type { QuizQuestion, EraId, Difficulty } from '@client/src/types/history';

interface QuizPlayState {
  questions: QuizQuestion[];
  title: string;
  quizId: string;
  isWrongBook?: boolean;
}

interface AnswerRecord {
  questionId: string;
  answer: string | boolean | null;
  correct: boolean | null;
}

const QuizPlayPage: React.FC = () => {
  useStudyTimerPage();
  const location = useLocation();
  const navigate = useNavigate();
  const addQuizRecord = useLearningStore((s) => s.addQuizRecord);
  const addWrongQuestion = useLearningStore((s) => s.addWrongQuestion);
  const removeWrongQuestion = useLearningStore((s) => s.removeWrongQuestion);
  const checkAchievements = useLearningStore((s) => s.checkAchievements);
  const addStudyTime = useLearningStore((s) => s.addStudyTime);

  const state = location.state as QuizPlayState | null;
  const questions = state?.questions ?? [];
  const title = state?.title ?? '历史测验';
  const quizId = state?.quizId ?? 'custom';
  const isWrongBook = state?.isWrongBook ?? false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>(
    questions.map((q) => ({
      questionId: q.id,
      answer: null,
      correct: null,
    })),
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showNavPanel, setShowNavPanel] = useState(false);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 如果没有题目，返回列表
  useEffect(() => {
    if (questions.length === 0) {
      navigate('/quiz', { replace: true });
    }
  }, [questions.length, navigate]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  const handleSelect = useCallback(
    (answer: string | boolean) => {
      if (showFeedback || !currentQuestion) return;

      const correct = isAnswerCorrect(currentQuestion, answer);
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = {
          questionId: currentQuestion.id,
          answer,
          correct,
        };
        return next;
      });
      setShowFeedback(true);

      // 错题自动加入错题本
      if (!correct && !isWrongBook) {
        addWrongQuestion(currentQuestion.id);
      }
      // 错题模式做对了从错题本移除
      if (correct && isWrongBook) {
        removeWrongQuestion(currentQuestion.id);
      }
    },
    [
      showFeedback,
      currentQuestion,
      currentIndex,
      isWrongBook,
      addWrongQuestion,
      removeWrongQuestion,
    ],
  );

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowFeedback(answers[currentIndex + 1].answer !== null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowFeedback(answers[currentIndex - 1].answer !== null);
    }
  };

  const handleJump = (idx: number) => {
    setCurrentIndex(idx);
    setShowFeedback(answers[idx].answer !== null);
    setShowNavPanel(false);
  };

  const handleFinish = () => {
    const answered = answers.filter((a) => a.answer !== null);
    const correctCount = answered.filter((a) => a.correct).length;
    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const wrongQuestionIds = answers
      .filter((a) => a.correct === false)
      .map((a) => a.questionId);

    // 确定难度和时期（取第一题的）
    const firstQ = questions[0];
    const difficulty = firstQ?.difficulty ?? 'elementary';
    const era = firstQ?.era ?? 'ancient';

    const record = {
      quizId,
      title,
      difficulty: difficulty as Difficulty,
      era: era as EraId,
      totalQuestions,
      correctCount,
      accuracy,
      timeSpent: elapsed,
      completedAt: new Date().toISOString(),
      wrongQuestionIds,
    };

    addQuizRecord(record);

    // 添加学习时间（向上取整分钟）
    const minutes = Math.max(1, Math.ceil(elapsed / 60));
    addStudyTime(minutes);

    // 检查成就
    const newly = checkAchievements();
    if (newly.length > 0) {
      newly.forEach((id) => {
        toast.success(`🏆 成就解锁：${id}`, {
          description: '继续努力，解锁更多成就！',
        });
      });
    }

    // 满分提示
    if (accuracy === 100) {
      toast.success('🎉 恭喜满分！', {
        description: '你对这段历史了如指掌！',
      });
    }

    navigate('/quiz/result', {
      state: {
        record,
        questions,
        answers,
        fromWrongBook: isWrongBook,
      },
    });
  };

  const answeredCount = answers.filter((a) => a.answer !== null).length;
  const progress = (answeredCount / questions.length) * 100;

  const getQuesStatus = (record: AnswerRecord) => {
    if (record.answer === null) return 'unanswered';
    return record.correct ? 'correct' : 'wrong';
  };

  if (questions.length === 0 || !currentQuestion) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowQuitDialog(true)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="text-sm">退出</span>
        </button>
        <h1 className="font-serif font-bold text-lg text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNavPanel(true)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">答题卡</span>
          </button>
        </div>
      </div>

      {/* 进度条 + 计时器 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            已答 {answeredCount}/{questions.length}
          </span>
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <Clock className="w-4 h-4 text-primary" />
            {formatTime(elapsed)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 题目卡片 */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswer={currentAnswer?.answer ?? null}
        showFeedback={showFeedback}
        onSelect={handleSelect}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
      />

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          上一题
        </Button>

        <div className="flex gap-2">
          {currentIndex === questions.length - 1 && answeredCount > 0 ? (
            <Button onClick={handleFinish}>
              提交答卷
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!showFeedback || currentIndex >= questions.length - 1}
            >
              下一题
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 退出确认弹窗 */}
      <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              确认退出测验？
            </DialogTitle>
            <DialogDescription>
              退出后当前答题进度将不会保存，确定要退出吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuitDialog(false)}
            >
              继续答题
            </Button>
            <Button variant="destructive" onClick={() => navigate('/quiz')}>
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 答题卡面板 */}
      <Dialog open={showNavPanel} onOpenChange={setShowNavPanel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>答题卡</DialogTitle>
            <DialogDescription>
              点击题号可以直接跳转到对应题目
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 py-2">
            {answers.map((record, idx) => {
              const status = getQuesStatus(record);
              const isCurrent = idx === currentIndex;
              let bgClass = '';
              let icon: React.ReactNode = null;

              switch (status) {
                case 'correct':
                  bgClass = 'bg-success/20 text-success border-success/40';
                  icon = <CheckCircle2 className="w-3 h-3" />;
                  break;
                case 'wrong':
                  bgClass = 'bg-destructive/20 text-destructive border-destructive/40';
                  icon = <XCircle className="w-3 h-3" />;
                  break;
                default:
                  bgClass = 'bg-secondary text-muted-foreground border-border';
                  icon = <Circle className="w-3 h-3" />;
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJump(idx)}
                  className={`relative aspect-square rounded-lg border text-sm font-medium flex items-center justify-center transition-all ${bgClass} ${
                    isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''
                  } hover:scale-105`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" /> 正确
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-destructive" /> 错误
            </span>
            <span className="flex items-center gap-1">
              <Circle className="w-3.5 h-3.5 text-muted-foreground" /> 未答
            </span>
          </div>
          <DialogFooter>
            {answeredCount > 0 && (
              <Button onClick={() => { setShowNavPanel(false); handleFinish(); }}>
                提交答卷
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizPlayPage;
