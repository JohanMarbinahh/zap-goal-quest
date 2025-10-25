import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Comment } from '@/types/nostr';
import { Profile } from '@/types/nostr';

interface CommentsState {
  commentsByGoal: Record<string, Comment[]>;
}

// Mock comment data
export const mockCommentProfiles: Profile[] = [
  {
    pubkey: 'mock_commenter_1',
    name: 'Alice',
    displayName: 'Alice',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    about: 'Crypto enthusiast and supporter',
  },
  {
    pubkey: 'mock_commenter_2',
    name: 'Bob',
    displayName: 'Bob',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    about: 'Bitcoin maximalist',
  },
  {
    pubkey: 'mock_commenter_3',
    name: 'Charlie',
    displayName: 'Charlie',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    about: 'Supporting great projects',
  },
  {
    pubkey: 'mock_commenter_4',
    name: 'Diana',
    displayName: 'Diana',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    about: 'Community builder',
  },
];

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
    addMockComments: (state, action: PayloadAction<string>) => {
      const goalEventId = action.payload;
      const now = Date.now() / 1000;
      
      const mockComments: Comment[] = [
        {
          eventId: 'mock_comment_1_' + goalEventId,
          createdAt: now - 7200, // 2 hours ago
          targetEventId: goalEventId,
          authorPubkey: mockCommentProfiles[0].pubkey,
          content: "This is a great project! Really excited to see how it develops. Keep up the amazing work! 🚀",
        },
        {
          eventId: 'mock_comment_2_' + goalEventId,
          createdAt: now - 14400, // 4 hours ago
          targetEventId: goalEventId,
          authorPubkey: mockCommentProfiles[1].pubkey,
          content: "Just zapped! Love seeing projects like this on Nostr. The transparency is amazing.",
        },
        {
          eventId: 'mock_comment_3_' + goalEventId,
          createdAt: now - 28800, // 8 hours ago
          targetEventId: goalEventId,
          authorPubkey: mockCommentProfiles[2].pubkey,
          content: "Really appreciate the detailed updates. This is exactly what Nostr needs! 💜⚡",
        },
        {
          eventId: 'mock_comment_4_' + goalEventId,
          createdAt: now - 43200, // 12 hours ago
          targetEventId: goalEventId,
          authorPubkey: mockCommentProfiles[3].pubkey,
          content: "Shared this with my community. Looking forward to seeing more progress! 🙌",
        },
        {
          eventId: 'mock_comment_5_' + goalEventId,
          createdAt: now - 86400, // 1 day ago
          targetEventId: goalEventId,
          authorPubkey: mockCommentProfiles[0].pubkey,
          content: "This is the kind of innovation that makes Nostr special. Count me in as a supporter!",
        },
      ];
      
      if (!state.commentsByGoal[goalEventId]) {
        state.commentsByGoal[goalEventId] = [];
      }
      
      // Add all mock comments that don't exist
      mockComments.forEach(comment => {
        const exists = state.commentsByGoal[goalEventId].some(c => c.eventId === comment.eventId);
        if (!exists) {
          state.commentsByGoal[goalEventId].push(comment);
        }
      });
    },
  },
});

export const { addComment, addMockComments } = commentsSlice.actions;
export default commentsSlice.reducer;
