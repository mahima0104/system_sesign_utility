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
  section: string;
}

export interface UserProgress {
  completedLessons: Set<string>;
  quizScores: Record<string, number>;
  moduleProgress: Record<string, number>; // moduleId -> 0-100
  totalXp: number;
  currentStreak: number;
  lastVisited: string | null;
}

// ─── Design Patterns ──────────────────────────────────────────────────────────

export type PatternCategory = 'Creational' | 'Structural' | 'Behavioral';

export interface PatternStep {
  title: string;
  description: string;
  /** Which entities to highlight in the visualization at this step. */
  highlight?: string[];
}

export interface PatternUseCase {
  company: string;
  description: string;
}

export interface PatternInterviewQuestion {
  question: string;
  answer: string;
}

export interface PatternEntity {
  id: string;
  label: string;
  /** Position on a 100×100 viewBox (percentage units) */
  x: number;
  y: number;
  icon?: string;
  color?: string;
}

export interface PatternRelation {
  from: string;
  to: string;
  label?: string;
}

export interface PatternVisualization {
  caption: string;
  entities: PatternEntity[];
  relations: PatternRelation[];
}

// ─── Concept Deep-Dives (core concept pages, beginner-friendly) ───────────────

export interface ConceptSubTopic {
  title: string;
  icon: string;
  /** Plain-English explanation aimed at a learner with no prior background. */
  layman: string;
  /** Deeper technical detail — the precision an interviewer expects. */
  technical: string;
  /** A concrete real-world or code example anchoring the abstraction. */
  example: string;
  /** When to use this approach (optional — useful for trade-offs). */
  whenToUse?: string;
}

export interface ConceptComparison {
  caption?: string;
  columns: string[];
  /** Each row is an array aligned with `columns`. */
  rows: string[][];
}

export interface ConceptExample {
  company: string;
  icon: string;
  description: string;
}

export interface ConceptInterviewQ {
  question: string;
  answer: string;
}

export interface ConceptDeepDive {
  /** Matches a Module.id, so /module/:id can render the deep dive. */
  moduleId: string;
  tagline: string;
  introduction: {
    /** "Imagine you have …" — the friendliest framing. */
    layman: string;
    /** A vivid real-world analogy. */
    analogy: string;
    /** Why this concept earns its place in interviews and real systems. */
    whyMatters: string;
  };
  subTopics: ConceptSubTopic[];
  comparison?: ConceptComparison;
  realWorldExamples: ConceptExample[];
  interviewQuestions: ConceptInterviewQ[];
  commonMistakes: string[];
  /** Optional: numeric reference data (e.g. SLA tables for availability). */
  metrics?: { name: string; value: string; notes?: string }[];
}

export interface DesignPattern {
  id: string;
  name: string;
  category: PatternCategory;
  icon: string;
  difficulty: Difficulty;
  tagline: string;

  // The 10 content sections
  definition: string;
  problem: string;
  whyNeeded: string;
  realLifeAnalogy: string;
  visualization: PatternVisualization;
  animationSteps: PatternStep[];
  codeExample: {
    language: string; // 'javascript' for now
    description: string;
    starter: string;
  };
  industryUseCases: PatternUseCase[];
  interviewQuestion: PatternInterviewQuestion;
  commonMistakes: string[];
}
