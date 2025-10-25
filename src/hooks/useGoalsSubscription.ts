import { useEffect, useState, useRef } from 'react';
import { useAppDispatch } from '@/stores/hooks';
import { store } from '@/stores/store';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
import { addReaction, addMockReactions, mockProfiles } from '@/stores/reactionsSlice';
import { setFollowing } from '@/stores/contactsSlice';
import { addUpdate } from '@/stores/updatesSlice';
import { selectEnrichedGoals, EnrichedGoal } from '@/stores/selectors';
import { Goal9041 } from '@/types/nostr';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735, parseReaction7, parseGoalUpdate } from '@/lib/nostrHelpers';
import type { NDKFilter, NDKSubscription, NDKEvent } from '@nostr-dev-kit/ndk';

const MIN_LOADING_TIME = 1000;
const MAX_GOALS_TO_LOAD = 100;
const IS_DEV = import.meta.env.DEV;

interface UseGoalsSubscriptionResult {
  initialLoading: boolean;
  backgroundLoading: boolean;
  goalsLoadedCount: number;
  displayedTotalCount: number;
  frozenGoals: EnrichedGoal[];
}

export const useGoalsSubscription = (
  existingGoals: EnrichedGoal[],
  userPubkey: string | null
): UseGoalsSubscriptionResult => {
  const dispatch = useAppDispatch();
  const [initialLoading, setInitialLoading] = useState(existingGoals.length === 0);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [goalsLoadedCount, setGoalsLoadedCount] = useState(0);
  const [displayedTotalCount, setDisplayedTotalCount] = useState(0);
  const [frozenGoals, setFrozenGoals] = useState<EnrichedGoal[]>([]);
  const loadStartTime = useRef(Date.now());
  const hasSubscribed = useRef(false);

  useEffect(() => {
    if (initialLoading) {
      setGoalsLoadedCount(existingGoals.length);
    }
  }, [existingGoals.length, initialLoading]);

  useEffect(() => {
    if (!initialLoading && backgroundLoading) {
      const roundedCount = Math.floor(existingGoals.length / 100) * 100;
      if (roundedCount > displayedTotalCount) {
        setDisplayedTotalCount(roundedCount);
      }
    } else if (!backgroundLoading) {
      setDisplayedTotalCount(existingGoals.length);
    }
  }, [existingGoals.length, initialLoading, backgroundLoading, displayedTotalCount]);

  useEffect(() => {
    let goalSub: NDKSubscription | null = null;
    let profileSub: NDKSubscription | null = null;
    let contactSub: NDKSubscription | null = null;
    let reactionSub: NDKSubscription | null = null;
    let updateSub: NDKSubscription | null = null;

    const subscribeToEvents = async () => {
      if (hasSubscribed.current) {
        if (IS_DEV) console.log('Already subscribed, skipping...');
        return;
      }
      hasSubscribed.current = true;

      if (existingGoals.length > 0) {
        if (IS_DEV) console.log('Goals already loaded, skipping subscription');
        setInitialLoading(false);
        return;
      }

      try {
        const ndk = await initializeNDK();
        if (!ndk) {
          setInitialLoading(false);
          return;
        }

        goalSub = await subscribeToGoals(ndk);
        profileSub = await subscribeToProfiles(ndk);
        if (userPubkey) {
          contactSub = await subscribeToContacts(ndk, userPubkey);
        }
      } catch (error) {
        console.error('Failed to subscribe to events:', error);
      }
    };

    const initializeNDK = async () => {
      let retries = 0;
      const maxRetries = 10;

      while (retries < maxRetries) {
        try {
          return getNDK();
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
      }

      console.error('NDK failed to initialize');
      return null;
    };

    const subscribeToGoals = async (ndk: any): Promise<NDKSubscription> => {
      const goalFilter: NDKFilter = { kinds: [9041 as any] };
      const sub = ndk.subscribe(goalFilter, { closeOnEose: false });
      let loadingScreenShown = false;

      sub.on('event', (event: NDKEvent) => {
        const goal = parseGoal9041(event);
        if (goal) {
          dispatch(setGoal({ goalId: goal.goalId, goal }));

          if (!loadingScreenShown && Object.keys(store.getState().goals.goals).length <= 10) {
            dispatch(addMockReactions(goal.eventId));
          }

          const currentCount = Object.keys(store.getState().goals.goals).length;
          const elapsedTime = Date.now() - loadStartTime.current;

          if (!loadingScreenShown && currentCount >= MAX_GOALS_TO_LOAD && elapsedTime >= MIN_LOADING_TIME) {
            if (IS_DEV) console.log(`✅ Reached ${currentCount} goals - showing page!`);
            loadingScreenShown = true;

            Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
              dispatch(setProfile({ pubkey, profile }));
            });

            setFrozenGoals(selectEnrichedGoals(store.getState()));
            setInitialLoading(false);
            setBackgroundLoading(true);
            setDisplayedTotalCount(Math.floor(currentCount / 100) * 100);
          }
        }
      });

      sub.on('eose', () => {
        const finalCount = Object.keys(store.getState().goals.goals).length;
        const elapsedTime = Date.now() - loadStartTime.current;

        if (IS_DEV) console.log(`📋 ${finalCount} goals loaded in ${elapsedTime}ms`);

        setBackgroundLoading(false);
        setDisplayedTotalCount(finalCount);

        if (!loadingScreenShown) {
          const currentGoals = Object.values(store.getState().goals.goals);
          currentGoals.slice(0, 10).forEach((goal: Goal9041) => {
            dispatch(addMockReactions(goal.eventId));
          });
          Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
            dispatch(setProfile({ pubkey, profile }));
          });

          setFrozenGoals(selectEnrichedGoals(store.getState()));

          const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

          if (remainingTime > 0) {
            setTimeout(() => setInitialLoading(false), remainingTime);
          } else {
            setInitialLoading(false);
          }
        }

        subscribeToRelatedData(ndk);
      });

      return sub;
    };

    const subscribeToRelatedData = (ndk: any): void => {
      const currentGoals = store.getState().goals.goals;
      const goalEventIds = Object.values(currentGoals).map((g: Goal9041) => g.eventId);

      if (IS_DEV) console.log(`🔍 Subscribing to data for ${goalEventIds.length} goals`);

      const allZapsFilter: NDKFilter = {
        kinds: [9735 as any],
        limit: 500
      };
      const testZapSub = ndk.subscribe(allZapsFilter, { closeOnEose: true });

      let zapCount = 0;
      let matchingZapCount = 0;
      const goalIdSet = new Set(goalEventIds);

      testZapSub.on('event', (event: NDKEvent) => {
        zapCount++;
        const zap = parseZap9735(event);
        if (zap && zap.targetEventId && goalIdSet.has(zap.targetEventId)) {
          matchingZapCount++;
          dispatch(addZap(zap));
        }
      });

      testZapSub.on('eose', () => {
        if (IS_DEV) console.log(`📊 ${zapCount} zaps found, ${matchingZapCount} matched`);
      });

      if (goalEventIds.length > 0) {
        const reactionFilter: NDKFilter = {
          kinds: [7 as any],
          '#e': goalEventIds,
          limit: 1000
        };
        reactionSub = ndk.subscribe(reactionFilter, { closeOnEose: false });

        reactionSub.on('event', (event: NDKEvent) => {
          const reaction = parseReaction7(event);
          if (reaction) {
            dispatch(addReaction(reaction));
          }
        });
      }

      const goalAuthors = [...new Set(Object.values(currentGoals).map((g: Goal9041) => g.authorPubkey))];

      if (goalAuthors.length > 0 && goalEventIds.length > 0) {
        const updateFilter: NDKFilter = {
          kinds: [1],
          authors: goalAuthors,
          '#e': goalEventIds,
          limit: 500
        };
        updateSub = ndk.subscribe(updateFilter, { closeOnEose: false });

        updateSub.on('event', (event: NDKEvent) => {
          const update = parseGoalUpdate(event);
          if (update) {
            dispatch(addUpdate(update));
          }
        });
      }
    };

    const subscribeToProfiles = async (ndk: any): Promise<NDKSubscription> => {
      const profileFilter: NDKFilter = { kinds: [0], limit: 50 };
      const sub = ndk.subscribe(profileFilter);

      sub.on('event', (event: NDKEvent) => {
        const profile = parseProfile(event);
        if (profile) {
          dispatch(setProfile({ pubkey: profile.pubkey, profile }));
        }
      });

      return sub;
    };

    const subscribeToContacts = async (ndk: any, pubkey: string): Promise<NDKSubscription> => {
      const contactFilter: NDKFilter = { kinds: [3], authors: [pubkey] };
      const sub = ndk.subscribe(contactFilter);

      sub.on('event', (event: NDKEvent) => {
        const following = event.tags
          .filter((tag: string[]) => tag[0] === 'p')
          .map((tag: string[]) => tag[1]);

        if (following.length > 0) {
          dispatch(setFollowing({ pubkey, following }));
        }
      });

      return sub;
    };

    subscribeToEvents();

    return () => {
      if (IS_DEV) console.log('🧹 Cleaning up subscriptions');
      goalSub?.stop();
      profileSub?.stop();
      contactSub?.stop();
      reactionSub?.stop();
      updateSub?.stop();
    };
  }, []);

  return {
    initialLoading,
    backgroundLoading,
    goalsLoadedCount,
    displayedTotalCount,
    frozenGoals,
  };
};
