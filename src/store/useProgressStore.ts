import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  completedLessons: string[];
  quizScores: Record<string, number>;
  totalXp: number;
  currentStreak: number;
  lastVisitedModule: string | null;

  completeLesson: (lessonId: string, xpReward?: number) => void;
  saveQuizScore: (quizId: string, score: number) => void;
  setLastVisitedModule: (moduleId: string) => void;
  getModuleProgress: (lessonIds: string[]) => number;
  isLessonComplete: (lessonId: string) => boolean;
  reset: () => void;
}

const initialState = {
  completedLessons: [] as string[],
  quizScores: {} as Record<string, number>,
  totalXp: 0,
  currentStreak: 0,
  lastVisitedModule: null as string | null,
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

      setLastVisitedModule: (moduleId) => set({ lastVisitedModule: moduleId }),

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
