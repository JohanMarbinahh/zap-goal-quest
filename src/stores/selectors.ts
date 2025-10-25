import { createSelector } from 'reselect';
import { RootState } from './store';
import { Goal9041, Profile, Zap9735 } from '@/types/nostr';
import { isUpvote, isDownvote } from '@/lib/reactionHelpers';

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
  upvotes: number;      // Count of + and empty string reactions
  downvotes: number;    // Count of - reactions
  reactionCount: number; // Count of emoji reactions (not votes)
  updateCount: number;
}

// Memoized selector that enriches all goals with profile, zap, and reaction data
export const selectEnrichedGoals = createSelector(
  [selectGoals, selectProfiles, selectZapsByGoal, selectReactionsByGoal],
  (goals, profiles, zapsByGoal, reactionsByGoal): EnrichedGoal[] => {
    return Object.values(goals).map(goal => {
      const profile = profiles[goal.authorPubkey];
      const zaps = zapsByGoal[goal.eventId] || [];
      const raised = zaps.reduce((sum, zap) => sum + Math.floor(zap.amountMsat / 1000), 0);
      const progress = Math.min((raised / goal.targetSats) * 100, 100);

      // Get reactions for this goal
      const reactions = reactionsByGoal[goal.eventId] || [];
      
      // Calculate vote counts
      const upvotes = reactions.filter(r => isUpvote(r.content)).length;
      const downvotes = reactions.filter(r => isDownvote(r.content)).length;
      const reactionCount = reactions.filter(r => !isUpvote(r.content) && !isDownvote(r.content)).length;

      return {
        ...goal,
        profile,
        zaps,
        raised,
        progress,
        upvotes,
        downvotes,
        reactionCount,
        updateCount: 0,   // Calculated locally per component
      };
    });
  }
);
