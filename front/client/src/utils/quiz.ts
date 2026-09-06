import { QUIZ_QUESTIONS } from '@client/src/data/quizzes';
import type { QuizQuestion, Difficulty, EraId, QuizType } from '@client/src/types/history';

export interface QuizFilter {
  difficulty: Difficulty | 'all';
  era: EraId | 'all';
  type: QuizType | 'all';
}

export function filterQuestions(filter: QuizFilter): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => {
    if (filter.difficulty !== 'all' && q.difficulty !== filter.difficulty) return false;
    if (filter.era !== 'all' && q.era !== filter.era) return false;
    if (filter.type !== 'all' && q.type !== filter.type) return false;
    return true;
  });
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandomQuestions(pool: QuizQuestion[], count: number): QuizQuestion[] {
  if (pool.length <= count) return shuffleArray(pool);
  return shuffleArray(pool).slice(0, count);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function isAnswerCorrect(
  question: QuizQuestion,
  answer: string | boolean | number,
): boolean {
  const correct = question.correctAnswer;
  if (typeof correct === 'boolean') {
    if (typeof answer === 'boolean') return answer === correct;
    if (typeof answer === 'string') {
      return (answer === 'true') === correct || answer === String(correct);
    }
    return false;
  }
  if (typeof correct === 'number') {
    if (typeof answer === 'number') return answer === correct;
    return Number(answer) === correct;
  }
  return String(answer) === String(correct);
}

export function getQuizTypeLabel(type: QuizType): string {
  switch (type) {
    case 'choice':
      return '选择题';
    case 'judge':
      return '判断题';
    case 'material':
      return '材料分析题';
    case 'short-answer':
      return '简答题';
    case 'image-choice':
      return '图片选择题';
    default:
      return '选择题';
  }
}
