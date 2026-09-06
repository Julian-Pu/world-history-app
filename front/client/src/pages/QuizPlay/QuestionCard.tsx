import { CheckCircle2, XCircle } from 'lucide-react';
import { EraBadge } from '@/components/EraBadge';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import type { QuizQuestion } from '@client/src/types/history';
import { isAnswerCorrect, getQuizTypeLabel } from '@client/src/utils/quiz';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: string | boolean | null;
  showFeedback: boolean;
  onSelect: (answer: string | boolean) => void;
  questionNumber: number;
  totalQuestions: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  showFeedback,
  onSelect,
  questionNumber,
  totalQuestions,
}) => {
  const isCorrect = showFeedback
    ? isAnswerCorrect(question, selectedAnswer as string | boolean)
    : null;

  const renderOptions = () => {
    switch (question.type) {
      case 'judge':
        return (
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: true, label: '正确', icon: CheckCircle2, color: 'text-success' },
              { value: false, label: '错误', icon: XCircle, color: 'text-destructive' },
            ].map((opt) => {
              const isSelected = selectedAnswer === opt.value;
              const isRight = question.correctAnswer === opt.value;
              let className =
                'relative p-5 rounded-xl border-2 transition-all text-left hover:border-primary/50';

              if (showFeedback) {
                if (isRight) {
                  className +=
                    ' border-success bg-success/10 text-success-foreground';
                } else if (isSelected) {
                  className +=
                    ' border-destructive bg-destructive/10 text-destructive-foreground';
                } else {
                  className += ' border-border opacity-60 bg-card';
                }
              } else if (isSelected) {
                className += ' border-primary bg-primary/10';
              } else {
                className += ' border-border bg-card hover:bg-secondary/50';
              }

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => !showFeedback && onSelect(opt.value)}
                  disabled={showFeedback}
                  className={className}
                >
                  <div className="flex items-center justify-center gap-2">
                    <opt.icon className={`w-6 h-6 ${opt.color}`} />
                    <span className="text-lg font-medium">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'choice':
      case 'image-choice':
      case 'material':
      default: {
        const options = question.options ?? [];
        return (
          <div className="space-y-3">
            {options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isRight = question.correctAnswer === option;
              let className =
                'relative w-full p-4 rounded-xl border-2 transition-all text-left hover:border-primary/50';

              if (showFeedback) {
                if (isRight) {
                  className +=
                    ' border-success bg-success/10 text-success-foreground';
                } else if (isSelected) {
                  className +=
                    ' border-destructive bg-destructive/10 text-destructive-foreground';
                } else {
                  className += ' border-border opacity-70 bg-card';
                }
              } else if (isSelected) {
                className += ' border-primary bg-primary/10';
              } else {
                className += ' border-border bg-card hover:bg-secondary/50';
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => !showFeedback && onSelect(option)}
                  disabled={showFeedback}
                  className={className}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        showFeedback && isRight
                          ? 'bg-success text-success-foreground'
                          : showFeedback && isSelected
                          ? 'bg-destructive text-destructive-foreground'
                          : isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-base">{option}</span>
                    {showFeedback && isRight && (
                      <CheckCircle2 className="w-5 h-5 text-success ml-auto shrink-0" />
                    )}
                    {showFeedback && isSelected && !isRight && (
                      <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 题目头部 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            第 {questionNumber}/{totalQuestions} 题
          </span>
          <EraBadge eraId={question.era} />
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-xs text-muted-foreground">
            {getQuizTypeLabel(question.type)}
          </span>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="bg-card rounded-xl p-5 md:p-6 border border-border">
        <h2 className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* 选项 */}
      {renderOptions()}

      {/* 解析反馈 */}
      {showFeedback && (
        <div
          className={`p-4 rounded-xl border ${
            isCorrect
              ? 'bg-success/10 border-success/30'
              : 'bg-destructive/10 border-destructive/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            <span
              className={`font-semibold ${
                isCorrect ? 'text-success' : 'text-destructive'
              }`}
            >
              {isCorrect ? '回答正确！' : '回答错误'}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            <span className="font-medium">解析：</span>
            {question.explanation}
          </p>
          {!isCorrect && (
            <p className="text-sm text-foreground/80 mt-2">
              <span className="font-medium">正确答案：</span>
              {String(question.correctAnswer)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export { QuestionCard };
