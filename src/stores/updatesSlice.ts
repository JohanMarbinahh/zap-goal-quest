import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GoalUpdate {
  eventId: string;
  goalEventId: string;
  authorPubkey: string;
  content: string;
  createdAt: number;
}

interface UpdatesState {
  updatesByGoal: Record<string, GoalUpdate[]>;
}

const initialState: UpdatesState = {
  updatesByGoal: {},
};

const updatesSlice = createSlice({
  name: 'updates',
  initialState,
  reducers: {
    addUpdate: (state, action: PayloadAction<GoalUpdate>) => {
      const goalId = action.payload.goalEventId;
      if (!state.updatesByGoal[goalId]) {
        state.updatesByGoal[goalId] = [];
      }
      // Avoid duplicates
      const exists = state.updatesByGoal[goalId].some(u => u.eventId === action.payload.eventId);
      if (!exists) {
        state.updatesByGoal[goalId].push(action.payload);
      }
    },
  },
});

export const { addUpdate } = updatesSlice.actions;
export default updatesSlice.reducer;
