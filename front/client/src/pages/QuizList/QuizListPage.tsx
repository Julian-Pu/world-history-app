import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Clock,
  Trophy,
  Target,
  Calendar,
  BookOpen,
  ChevronRight,
  Flame,
  Filter,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { ERAS, DIFFICULTY_LEVELS } from '@client/src/data/eras';
import { useDailyQuiz, isDailyQuizCompleted } from '@client/src/hooks/useDailyQuiz';
import { filterQuestions, pickRandomQuestions, formatTime } from '@client/src/utils/quiz';
import type { Difficulty, EraId, QuizType } from '@client/src/types/history';

const QUIZ_TYPE_OPTIONS: { value: QuizType | 'all'; label: string }[] = [
  { value: 'all', label: '全部题型' },
  { value: 'choice', label: '选择题' },
  { value: 'judge', label: '判断题' },
  { value: 'material', label: '材料题' },
  { value: 'image-choice', label: '图片题' },
];

const QUESTION_COUNT_OPTIONS = [
  { value: 10, label: '10 题', sub: '快速练习' },
  { value: 20, label: '20 题', sub: '标准测验' },
  { value: 50, label: '50 题', sub: '完整挑战' },
];

const QuizListPage: React.FC = () => {
  const navigate = useNavigate();
  const difficulty = useAppStore((s) => s.difficulty);
  const quizRecords = useLearningStore((s) => s.quizRecords);
  const wrongQuestions = useLearningStore((s) => s.wrongQuestions);
  const addWrongQuestion = useLearningStore((s) => s.addWrongQuestion);

  const [selectedEra, setSelectedEra] = useState<EraId | 'all'>('all');
  const [selectedType, setSelectedType] = useState<QuizType | 'all'>('all');
  const [questionCount, setQuestionCount] = useState(10);

  const dailyQuestions = useDailyQuiz(difficulty);
  const dailyDone = isDailyQuizCompleted(quizRecords);

  const filteredCount = useMemo(() => {
    return filterQuestions({
      difficulty,
      era: selectedEra,
      type: selectedType,
    }).length;
  }, [difficulty, selectedEra, selectedType]);

  const recentRecords = useMemo(() => {
    return quizRecords.slice(0, 5);
  }, [quizRecords]);

  const handleStartQuiz = () => {
    const pool = filterQuestions({
      difficulty,
      era: selectedEra,
      type: selectedType,
    });

    if (pool.length === 0) {
      toast.warning('当前筛选条件下没有题目，请调整筛选条件');
      return;
    }

    const questions = pickRandomQuestions(pool, questionCount);
    const state = {
      questions,
      title: `${DIFFICULTY_LEVELS.find((d) => d.id === difficulty)?.name}测验`,
      quizId: 'custom',
      isWrongBook: false,
    };
    navigate('/quiz/play', { state });
  };

  const handleStartDaily = () => {
    if (dailyQuestions.length === 0) {
      toast.warning('今日暂无题目');
      return;
    }
    const state = {
      questions: dailyQuestions,
      title: '今日一练',
      quizId: 'daily',
      isWrongBook: false,
    };
    navigate('/quiz/play', { state });
  };

  const handleStartWrongBook = () => {
    if (wrongQuestions.length === 0) {
      toast.warning('错题本暂无题目，先去测验吧！');
      return;
    }
    navigate('/quiz/wrong');
  };

  return (
    <div className="space-y-6" data-ai-section-type="card-list">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            历史测验
          </h1>
          <p className="text-muted-foreground mt-1">
            检验知识掌握程度，查漏补缺
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1">
          <Filter className="w-3.5 h-3.5" />
          当前难度：{DIFFICULTY_LEVELS.find((d) => d.id === difficulty)?.name}
        </Badge>
      </div>

      {/* 今日一练卡片 */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Flame className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-serif font-bold text-foreground">
                    今日一练
                  </h3>
                  {dailyDone && (
                    <Badge
                      variant="default"
                      className="bg-success/20 text-success border-success/30"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> 已完成
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  每天 {dailyQuestions.length} 道精选题目，日积月累成就历史达人
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    {dailyQuestions.length} 道题
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    约 3-5 分钟
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleStartDaily}
              className="shrink-0 min-w-[120px]"
            >
              <Play className="w-4 h-4" />
              {dailyDone ? '再练一次' : '开始练习'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：筛选 + 组卷 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 筛选区 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                组卷筛选
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 时期筛选 */}
              <div>
                <div className="text-sm font-medium text-foreground mb-2">
                  历史时期
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEra('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedEra === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    全部
                  </button>
                  {ERAS.map((era) => (
                    <button
                      key={era.id}
                      type="button"
                      onClick={() => setSelectedEra(era.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedEra === era.id
                          ? 'text-white'
                          : 'text-secondary-foreground hover:bg-secondary/80 bg-secondary'
                      }`}
                      style={
                        selectedEra === era.id
                          ? { backgroundColor: era.color }
                          : undefined
                      }
                    >
                      {era.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 题型筛选 */}
              <div>
                <div className="text-sm font-medium text-foreground mb-2">
                  题目类型
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUIZ_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedType === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 组卷设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                组卷设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="text-sm font-medium text-foreground mb-3">
                  题目数量
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {QUESTION_COUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuestionCount(opt.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        questionCount === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 bg-card'
                      }`}
                    >
                      <div className="text-xl font-serif font-bold text-foreground">
                        {opt.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {opt.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  可用题目：
                  <span className="font-semibold text-foreground">
                    {filteredCount}
                  </span>
                  <span className="mx-1">/</span>
                  抽取
                  <span className="font-semibold text-foreground">
                    {Math.min(questionCount, filteredCount)}
                  </span>
                  题
                </div>
                <Button size="lg" onClick={handleStartQuiz}>
                  <Play className="w-4 h-4" />
                  开始测验
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：快捷入口 + 错题本 */}
        <div className="space-y-6">
          {/* 错题本入口 */}
          <Card
            className="cursor-pointer hover:border-accent/50 transition-colors"
            onClick={handleStartWrongBook}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-destructive/15 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">错题本</div>
                    <div className="text-xs text-muted-foreground">
                      {wrongQuestions.length} 道错题待攻克
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* 成绩统计速览 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                成绩统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-serif font-bold text-foreground">
                  {quizRecords.length}
                </div>
                <div className="text-sm text-muted-foreground">完成测验次数</div>
              </div>
              <Progress
                value={
                  quizRecords.length > 0
                    ? Math.round(
                        quizRecords.reduce((sum, r) => sum + r.accuracy, 0) /
                          quizRecords.length,
                      )
                    : 0
                }
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>平均正确率</span>
                <span className="font-semibold text-foreground">
                  {quizRecords.length > 0
                    ? Math.round(
                        quizRecords.reduce((sum, r) => sum + r.accuracy, 0) /
                          quizRecords.length,
                      )
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 历史成绩 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            最近成绩
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无测验记录，开始你的第一次测验吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        record.accuracy >= 80
                          ? 'bg-success/15 text-success'
                          : record.accuracy >= 60
                          ? 'bg-warning/15 text-warning'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {record.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.completedAt).toLocaleDateString()} ·{' '}
                        {record.correctCount}/{record.totalQuestions} 题
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif font-bold text-lg text-foreground">
                      {Math.round(record.accuracy)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      用时 {formatTime(record.timeSpent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizListPage;
