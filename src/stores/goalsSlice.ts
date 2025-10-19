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
      state.goals[action.payload.goalId] = action.payload.goal;
    },
  },
});

export const { setGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
