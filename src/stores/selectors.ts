import { createSelector } from 'reselect';
import { RootState } from './store';
import { Goal9041, Profile, Zap9735 } from '@/types/nostr';

// Base selectors
const selectGoals = (state: RootState) => state.goals.goals;
const selectProfiles = (state: RootState) => state.profiles.profiles;
const selectZapsByGoal = (state: RootState) => state.zaps.zapsByGoal;
const selectReactionsByGoal = (state: RootState) => state.reactions?.reactionsByGoal || {};

// Enriched goal type with pre-calculated data
export interface EnrichedGoal extends Goal9041 {
  profile?: Profile;
  zaps: Zap9735[];
  raised: number;
  progress: number;
  likeCount: number;
  dislikeCount: number;
  updateCount: number;
  topReactions: Array<{ emoji: string; count: number }>;
}

// Memoized selector that enriches all goals with profile and zap data
export const selectEnrichedGoals = createSelector(
  [selectGoals, selectProfiles, selectZapsByGoal, selectReactionsByGoal],
  (goals, profiles, zapsByGoal, reactionsByGoal): EnrichedGoal[] => {
    return Object.values(goals).map(goal => {
      const profile = profiles[goal.authorPubkey];
      const zaps = zapsByGoal[goal.eventId] || [];
      const raised = zaps.reduce((sum, zap) => sum + Math.floor(zap.amountMsat / 1000), 0);
      const progress = Math.min((raised / goal.targetSats) * 100, 100);
      
      // Calculate likes and dislikes from reactions
      const reactions = reactionsByGoal[goal.eventId] || [];
      const likeCount = reactions.filter(r => r.content === '+' || r.content === '').length;
      const dislikeCount = reactions.filter(r => r.content === '-').length;
      
      // Calculate top emoji reactions (excluding +, -, and empty string)
      const emojiReactions = reactions.filter(r => 
        r.content !== '+' && r.content !== '-' && r.content !== ''
      );
      
      const emojiCounts = emojiReactions.reduce((acc, r) => {
        acc[r.content] = (acc[r.content] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topReactions = Object.entries(emojiCounts)
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 3 emoji reactions

      return {
        ...goal,
        profile,
        zaps,
        raised,
        progress,
        likeCount,
        dislikeCount,
        updateCount: 0,   // Calculated locally per component
        topReactions,
      };
    });
  }
);
