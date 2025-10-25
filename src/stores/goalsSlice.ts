import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Goal9041 } from '@/types/nostr';

interface GoalsState {
  goals: Record<string, Goal9041>;
}

const initialState: GoalsState = {
  goals: {},
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    setGoal: (state, action: PayloadAction<{ goalId: string; goal: Goal9041 }>) => {
      const { goalId, goal } = action.payload;
      const existingGoal = state.goals[goalId];
      
      // If there's an existing goal with this goalId, only replace if the new one is newer
      if (!existingGoal || goal.createdAt >= existingGoal.createdAt) {
        state.goals[goalId] = goal;
      }
    },
  },
});

export const { setGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
