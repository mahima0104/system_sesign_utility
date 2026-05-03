import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConceptProgress {
  completedSubTopics: string[];
  confidence: number;
  memo: string;
}

interface ProgressState {
  completedLessons: string[];
  quizScores: Record<string, number>;
  conceptProgress: Record<string, ConceptProgress>;
  totalXp: number;
  currentStreak: number;
  lastVisitedModule: string | null;

  completeLesson: (lessonId: string, xpReward?: number) => void;
  saveQuizScore: (quizId: string, score: number) => void;
  toggleConceptSubTopic: (conceptId: string, subTopic: string) => void;
  setConceptConfidence: (conceptId: string, confidence: number) => void;
  setConceptMemo: (conceptId: string, memo: string) => void;
  getConceptProgress: (conceptId: string, subTopics: string[]) => number;
  setLastVisitedModule: (moduleId: string) => void;
  getModuleProgress: (lessonIds: string[]) => number;
  isLessonComplete: (lessonId: string) => boolean;
  reset: () => void;
}

const initialState = {
  completedLessons: [] as string[],
  quizScores: {} as Record<string, number>,
  conceptProgress: {} as Record<string, ConceptProgress>,
  totalXp: 0,
  currentStreak: 0,
  lastVisitedModule: null as string | null,
};

const emptyConceptProgress: ConceptProgress = {
  completedSubTopics: [],
  confidence: 0,
  memo: '',
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeLesson: (lessonId, xpReward = 10) => {
        const { completedLessons } = get();
        if (!completedLessons.includes(lessonId)) {
          set((s) => ({
            completedLessons: [...s.completedLessons, lessonId],
            totalXp: s.totalXp + xpReward,
          }));
        }
      },

      saveQuizScore: (quizId, score) => {
        set((s) => ({
          quizScores: { ...s.quizScores, [quizId]: score },
          totalXp: s.totalXp + Math.round(score * 0.5),
        }));
      },

      toggleConceptSubTopic: (conceptId, subTopic) => {
        set((s) => {
          const current = s.conceptProgress[conceptId] ?? emptyConceptProgress;
          const completedSubTopics = current.completedSubTopics.includes(subTopic)
            ? current.completedSubTopics.filter((item) => item !== subTopic)
            : [...current.completedSubTopics, subTopic];

          return {
            conceptProgress: {
              ...s.conceptProgress,
              [conceptId]: {
                ...current,
                completedSubTopics,
              },
            },
          };
        });
      },

      setConceptConfidence: (conceptId, confidence) => {
        set((s) => {
          const current = s.conceptProgress[conceptId] ?? emptyConceptProgress;
          return {
            conceptProgress: {
              ...s.conceptProgress,
              [conceptId]: {
                ...current,
                confidence: Math.max(0, Math.min(100, confidence)),
              },
            },
          };
        });
      },

      setConceptMemo: (conceptId, memo) => {
        set((s) => {
          const current = s.conceptProgress[conceptId] ?? emptyConceptProgress;
          return {
            conceptProgress: {
              ...s.conceptProgress,
              [conceptId]: {
                ...current,
                memo,
              },
            },
          };
        });
      },

      setLastVisitedModule: (moduleId) => set({ lastVisitedModule: moduleId }),

      getConceptProgress: (conceptId, subTopics) => {
        const current = get().conceptProgress[conceptId];
        if (!subTopics.length || !current) return 0;
        const done = subTopics.filter((subTopic) => current.completedSubTopics.includes(subTopic)).length;
        return Math.round((done / subTopics.length) * 100);
      },

      getModuleProgress: (lessonIds) => {
        const { completedLessons } = get();
        if (!lessonIds.length) return 0;
        const done = lessonIds.filter((id) => completedLessons.includes(id)).length;
        return Math.round((done / lessonIds.length) * 100);
      },

      isLessonComplete: (lessonId) => get().completedLessons.includes(lessonId),

      reset: () => set(initialState),
    }),
    { name: 'sda-progress' }
  )
);
