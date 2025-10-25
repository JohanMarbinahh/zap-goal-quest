import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reaction7 } from '@/types/nostr';
import { Profile } from '@/types/nostr';

interface ReactionsState {
  reactionsByGoal: Record<string, Reaction7[]>;
}

// Mock profiles for demo users
export const mockProfiles: Record<string, Profile> = {
  'npub1mock1user1111111111111111111111111111111111111111111111': {
    pubkey: 'npub1mock1user1111111111111111111111111111111111111111111111',
    name: 'alice',
    displayName: 'Alice',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    about: 'Bitcoin enthusiast',
  },
  'npub1mock2user2222222222222222222222222222222222222222222222': {
    pubkey: 'npub1mock2user2222222222222222222222222222222222222222222222',
    name: 'bob',
    displayName: 'Bob',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    about: 'Lightning Network developer',
  },
  'npub1mock3user3333333333333333333333333333333333333333333333': {
    pubkey: 'npub1mock3user3333333333333333333333333333333333333333333333',
    name: 'charlie',
    displayName: 'Charlie',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    about: 'Nostr builder',
  },
  'npub1mock4user4444444444444444444444444444444444444444444444': {
    pubkey: 'npub1mock4user4444444444444444444444444444444444444444444444',
    name: 'diana',
    displayName: 'Diana',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    about: 'Designer & creator',
  },
  'npub1mock5user5555555555555555555555555555555555555555555555': {
    pubkey: 'npub1mock5user5555555555555555555555555555555555555555555555',
    name: 'eve',
    displayName: 'Eve',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve',
    about: 'Open source advocate',
  },
};

// Mock reaction data generator
const generateMockReactions = (goalId: string): Reaction7[] => {
  const emojis = ['❤️', '🔥', '+', '👍', '🎉', '🚀', '💯', '⚡', '🌟', '💪'];
  const mockPubkeys = [
    'npub1mock1user1111111111111111111111111111111111111111111111',
    'npub1mock2user2222222222222222222222222222222222222222222222',
    'npub1mock3user3333333333333333333333333333333333333333333333',
    'npub1mock4user4444444444444444444444444444444444444444444444',
    'npub1mock5user5555555555555555555555555555555555555555555555',
  ];
  
  const reactions: Reaction7[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Generate reactions
  emojis.forEach((emoji, index) => {
    const count = emoji === '❤️' ? 10 : emoji === '🔥' ? 8 : emoji === '+' ? 7 : Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < count; i++) {
      reactions.push({
        eventId: `${goalId}-reaction-${emoji}-${i}`,
        reactorPubkey: mockPubkeys[i % mockPubkeys.length],
        content: emoji,
        createdAt: now - (index * 3600) - (i * 300), // Stagger times
        targetEventId: goalId,
      });
    }
  });
  
  return reactions;
};

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
    addMockReactions: (state, action: PayloadAction<string>) => {
      const goalId = action.payload;
      if (!state.reactionsByGoal[goalId]) {
        state.reactionsByGoal[goalId] = generateMockReactions(goalId);
      }
    },
  },
});

export const { addReaction, addMockReactions } = reactionsSlice.actions;
export default reactionsSlice.reducer;
