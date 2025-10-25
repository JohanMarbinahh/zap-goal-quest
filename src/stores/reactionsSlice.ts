import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reaction7 } from '@/types/nostr';

interface ReactionsState {
  reactionsByGoal: Record<string, Reaction7[]>;
}

const initialState: ReactionsState = {
  reactionsByGoal: {},
};

const reactionsSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    addReaction: (state, action: PayloadAction<Reaction7>) => {
      const goalId = action.payload.targetEventId;
      if (!state.reactionsByGoal[goalId]) {
        state.reactionsByGoal[goalId] = [];
      }
      // Avoid duplicates
      const exists = state.reactionsByGoal[goalId].some(r => r.eventId === action.payload.eventId);
      if (!exists) {
        state.reactionsByGoal[goalId].push(action.payload);
      }
    },
  },
});

export const { addReaction } = reactionsSlice.actions;
export default reactionsSlice.reducer;
