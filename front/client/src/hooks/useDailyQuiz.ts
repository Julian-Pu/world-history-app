import { useMemo } from 'react';
import { QUIZ_QUESTIONS } from '@client/src/data/quizzes';
import type { QuizQuestion, Difficulty } from '@client/src/types/history';

const DAILY_QUIZ_COUNT = 5;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function getDailySeed(): number {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  return parseInt(dateStr, 10);
}

export function useDailyQuiz(difficulty: Difficulty): QuizQuestion[] {
  return useMemo(() => {
    const seed = getDailySeed();
    const rng = seededRandom(seed);
    const pool = QUIZ_QUESTIONS.filter((q) => q.difficulty === difficulty);

    if (pool.length === 0) return [];

    // Fisher-Yates shuffle with seed
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(DAILY_QUIZ_COUNT, shuffled.length));
  }, [difficulty]);
}

export function isDailyQuizCompleted(quizRecords: { quizId: string; completedAt: string }[]): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return quizRecords.some(
    (r) => r.quizId === 'daily' && r.completedAt.slice(0, 10) === today,
  );
}
