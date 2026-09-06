export type Difficulty = 'kindergarten' | 'elementary' | 'middle' | 'high';

export type EraId = 'ancient' | 'medieval' | 'early-modern' | 'industrial' | 'modern';

export type RegionId = 'europe' | 'asia' | 'africa' | 'americas' | 'global';

export type QuizType = 'choice' | 'judge' | 'material' | 'short-answer' | 'image-choice';

export interface Era {
  id: EraId;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
}

export interface Region {
  id: RegionId;
  name: string;
  color: string;
}

export interface DifficultyLevel {
  id: Difficulty;
  name: string;
  description: string;
}

export interface EventContentByDifficulty {
  summary: string;
  background: string;
  process: string;
  impact: string;
  funFacts?: string[];
  keyFigures: string[];
  relatedEventIds: string[];
}

export interface HistoryEvent {
  id: string;
  title: string;
  era: EraId;
  region: RegionId;
  startYear: number;
  endYear: number;
  location: string;
  keyFigureIds: string[];
  content: Record<Difficulty, EventContentByDifficulty>;
  imagePrompt?: string;
}

export interface FigureContentByDifficulty {
  identity: string;
  bio: string;
  achievements: string;
  evaluation: string;
  funFacts?: string[];
  relatedEventIds: string[];
}

export interface HistoricalFigure {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number;
  era: EraId;
  region: RegionId;
  content: Record<Difficulty, FigureContentByDifficulty>;
  imagePrompt?: string;
}

export interface QuizQuestion {
  id: string;
  difficulty: Difficulty;
  era: EraId;
  type: QuizType;
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  relatedEventId?: string;
  imageUrl?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: {
    type: 'events-read' | 'quiz-perfect' | 'streak-days' | 'notes-count' | 'era-complete' | 'study-hours';
    value: number;
    eraId?: EraId;
  };
}

export interface MapCivilization {
  id: string;
  name: string;
  era: EraId;
  startYear: number;
  endYear: number;
  region: RegionId;
  color: string;
  positions: { x: number; y: number; label?: string }[];
  territoryPaths?: string[];
}

export interface MapEventMarker {
  eventId: string;
  x: number;
  y: number;
}

export interface UserLearningData {
  readEvents: string[];
  readFigures: string[];
  favorites: {
    events: string[];
    figures: string[];
  };
  notes: Note[];
  quizRecords: QuizRecord[];
  wrongQuestions: string[];
  achievements: string[];
  studyCalendar: Record<string, { minutes: number; eventsRead: number }>;
  totalStudyMinutes: number;
  streakDays: number;
  lastStudyDate: string;
}

export interface Note {
  id: string;
  eventId?: string;
  figureId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizRecord {
  id: string;
  quizId: string;
  title: string;
  difficulty: Difficulty;
  era: EraId;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  timeSpent: number;
  completedAt: string;
  wrongQuestionIds: string[];
}

export interface AppSettings {
  difficulty: Difficulty;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  storageMode: 'local' | 'cloud';
  searchHistory: string[];
}
