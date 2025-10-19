import { createSelector } from 'reselect';
import { RootState } from './store';
import { Goal9041, Profile, Zap9735 } from '@/types/nostr';

// Base selectors
const selectGoals = (state: RootState) => state.goals.goals;
const selectProfiles = (state: RootState) => state.profiles.profiles;
const selectZapsByGoal = (state: RootState) => state.zaps.zapsByGoal;

// Enriched goal type with pre-calculated data
export interface EnrichedGoal extends Goal9041 {
  profile?: Profile;
  zaps: Zap9735[];
  raised: number;
  progress: number;
}

// Memoized selector that enriches all goals with profile and zap data
export const selectEnrichedGoals = createSelector(
  [selectGoals, selectProfiles, selectZapsByGoal],
  (goals, profiles, zapsByGoal): EnrichedGoal[] => {
    return Object.values(goals).map(goal => {
      const profile = profiles[goal.authorPubkey];
      const zaps = zapsByGoal[goal.eventId] || [];
      const raised = zaps.reduce((sum, zap) => sum + Math.floor(zap.amountMsat / 1000), 0);
      const progress = Math.min((raised / goal.targetSats) * 100, 100);

      return {
        ...goal,
        profile,
        zaps,
        raised,
        progress,
      };
    });
  }
);
