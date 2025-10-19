import { create } from 'zustand';
import { Goal9041 } from '@/types/nostr';

interface GoalsState {
  goals: Map<string, Goal9041>;
  setGoal: (goalId: string, goal: Goal9041) => void;
  getGoal: (goalId: string) => Goal9041 | undefined;
  getAllGoals: () => Goal9041[];
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: new Map(),
  setGoal: (goalId, goal) =>
    set((state) => {
      const newGoals = new Map(state.goals);
      newGoals.set(goalId, goal);
      return { goals: newGoals };
    }),
  getGoal: (goalId) => get().goals.get(goalId),
  getAllGoals: () => Array.from(get().goals.values()),
}));
