import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XCircle,
  Trash2,
  Play,
  Filter,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EraBadge } from '@/components/EraBadge';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { QUIZ_QUESTIONS } from '@client/src/data/quizzes';
import { ERAS, DIFFICULTY_LEVELS } from '@client/src/data/eras';
import { getQuizTypeLabel } from '@client/src/utils/quiz';
import type { Difficulty, EraId } from '@client/src/types/history';

const WrongBookPage: React.FC = () => {
  const navigate = useNavigate();
  const wrongQuestionIds = useLearningStore((s) => s.wrongQuestions);
  const removeWrongQuestion = useLearningStore((s) => s.removeWrongQuestion);
  const clearWrongQuestions = useLearningStore((s) => s.clearWrongQuestions);

  const [selectedEra, setSelectedEra] = useState<EraId | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const wrongQuestions = useMemo(() => {
    const idSet = new Set(wrongQuestionIds);
    return QUIZ_QUESTIONS.filter((q) => idSet.has(q.id));
  }, [wrongQuestionIds]);

  const filteredQuestions = useMemo(() => {
    return wrongQuestions.filter((q) => {
      if (selectedEra !== 'all' && q.era !== selectedEra) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      return true;
    });
  }, [wrongQuestions, selectedEra, selectedDifficulty]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartRedo = () => {
    if (filteredQuestions.length === 0) {
      toast.warning('当前筛选条件下没有错题');
      return;
    }
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    navigate('/quiz/play', {
      state: {
        questions: shuffled,
        title: '错题重做',
        quizId: 'wrong-book',
        isWrongBook: true,
      },
    });
  };

  const handleRemove = (id: string) => {
    removeWrongQuestion(id);
    toast.success('已从错题本移除');
  };

  const handleClear = () => {
    clearWrongQuestions();
    setShowClearDialog(false);
    toast.success('已清空错题本');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/quiz')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              错题本
            </h1>
            <p className="text-sm text-muted-foreground">
              共 {wrongQuestions.length} 道错题，反复练习直到掌握
            </p>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                {filteredQuestions.length} / {wrongQuestions.length} 道
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                disabled={wrongQuestions.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
              <Button
                size="sm"
                onClick={handleStartRedo}
                disabled={filteredQuestions.length === 0}
              >
                <Play className="w-4 h-4" />
                开始重做
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 筛选区 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="w-4 h-4 text-primary" />
            筛选
          </div>
          {/* 时期筛选 */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">历史时期</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedEra('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedEra === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                全部
              </button>
              {ERAS.map((era) => {
                const count = wrongQuestions.filter((q) => q.era === era.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => setSelectedEra(era.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedEra === era.id
                        ? 'text-white'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    style={
                      selectedEra === era.id
                        ? { backgroundColor: era.color }
                        : undefined
                    }
                  >
                    {era.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          {/* 难度筛选 */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">难度</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDifficulty('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedDifficulty === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                全部
              </button>
              {DIFFICULTY_LEVELS.map((level) => {
                const count = wrongQuestions.filter(
                  (q) => q.difficulty === level.id,
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSelectedDifficulty(level.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedDifficulty === level.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {level.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错题列表 */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">暂无错题</h3>
              <p className="text-sm text-muted-foreground">
                {wrongQuestions.length === 0
                  ? '去做测验吧，错题会自动收录到这里'
                  : '当前筛选条件下没有错题'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => {
            const isExpanded = expandedIds.has(question.id);
            return (
              <Card key={question.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <EraBadge eraId={question.era} />
                        <DifficultyBadge difficulty={question.difficulty} />
                        <span className="text-xs text-muted-foreground">
                          {getQuizTypeLabel(question.type)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-medium leading-relaxed">
                        {question.question}
                      </p>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-sm">
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
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => toggleExpand(question.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          收起解析
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          查看解析
                        </>
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(question.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      移除
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 清空确认弹窗 */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              确认清空错题本？
            </DialogTitle>
            <DialogDescription>
              清空后所有错题记录将被删除，此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WrongBookPage;
