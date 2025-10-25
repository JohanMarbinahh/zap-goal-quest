import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Comment } from '@/types/nostr';

interface CommentsState {
  commentsByGoal: Record<string, Comment[]>;
}

const initialState: CommentsState = {
  commentsByGoal: {},
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    addComment: (state, action: PayloadAction<Comment>) => {
      const { targetEventId, eventId } = action.payload;
      if (!state.commentsByGoal[targetEventId]) {
        state.commentsByGoal[targetEventId] = [];
      }
      // Check if comment already exists to prevent duplicates
      const exists = state.commentsByGoal[targetEventId].some(c => c.eventId === eventId);
      if (!exists) {
        state.commentsByGoal[targetEventId].push(action.payload);
      }
    },
  },
});

export const { addComment } = commentsSlice.actions;
export default commentsSlice.reducer;
