import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Comment } from '@/types/nostr';
import { Profile } from '@/types/nostr';

interface CommentsState {
  commentsByGoal: Record<string, Comment[]>;
}

// Mock comment data
export const mockCommentProfile: Profile = {
  pubkey: 'mock_commenter_123',
  name: 'Alice',
  displayName: 'Alice',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  about: 'Crypto enthusiast and supporter',
};

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
    addMockComment: (state, action: PayloadAction<string>) => {
      const goalEventId = action.payload;
      const mockComment: Comment = {
        eventId: 'mock_comment_' + goalEventId,
        createdAt: Date.now() / 1000 - 3600, // 1 hour ago
        targetEventId: goalEventId,
        authorPubkey: mockCommentProfile.pubkey,
        content: "This is a great project! Really excited to see how it develops. Keep up the amazing work! 🚀",
      };
      
      if (!state.commentsByGoal[goalEventId]) {
        state.commentsByGoal[goalEventId] = [];
      }
      
      // Only add if it doesn't exist
      const exists = state.commentsByGoal[goalEventId].some(c => c.eventId === mockComment.eventId);
      if (!exists) {
        state.commentsByGoal[goalEventId].push(mockComment);
      }
    },
  },
});

export const { addComment, addMockComment } = commentsSlice.actions;
export default commentsSlice.reducer;
