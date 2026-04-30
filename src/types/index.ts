export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  type: 'concept' | 'demo' | 'quiz' | 'challenge';
  component: string; // component key to render
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  estimatedTime: number; // minutes
  tags: string[];
  lessons: Lesson[];
  realWorldAnalogy: string;
  color: string; // tailwind color class prefix e.g. 'blue'
}

export interface UserProgress {
  completedLessons: Set<string>;
  quizScores: Record<string, number>;
  moduleProgress: Record<string, number>; // moduleId -> 0-100
  totalXp: number;
  currentStreak: number;
  lastVisited: string | null;
}
