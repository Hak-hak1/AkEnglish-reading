
export interface Vocabulary {
  id: string;
  word: string;
  ipa: string;
  englishDefinition: string; // Added: Explanation in English
  meaning: string; // Vietnamese translation
  type: string; // noun, verb, adj, etc.
}

export interface LessonContent {
  id: string;
  title: string;
  fullText: string;
  summary: string;
  vocabulary: Vocabulary[];
  dateCreated: number;
  imageUrl?: string; // Added field for image source
}

export type QuizType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'drag_drop' | 'matching';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[]; // For MCQ and Drag Drop
  correctAnswer: string | string[]; // String for most, array for matching pairs if needed
  userAnswer?: string;
  explanation?: string;
}

export interface QuizSession {
  questions: QuizQuestion[];
  isCompleted: boolean;
  score: number;
}

export enum AppState {
  HOME = 'HOME',
  PROCESSING = 'PROCESSING',
  LEARNING = 'LEARNING',
  QUIZ = 'QUIZ',
}