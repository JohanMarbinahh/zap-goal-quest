import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/stores/hooks';
import { setProfile } from '@/stores/profilesSlice';
import { getNDK } from '@/lib/ndk';
import { parseComment } from '@/lib/nostrHelpers';
import type { NDKFilter, NDKSubscription, NDKEvent } from '@nostr-dev-kit/ndk';
import type { Comment } from '@/types/nostr';

// Mock data for demo
const mockComments: Comment[] = [
  {
    eventId: 'mock-comment-1',
    targetEventId: '',
    authorPubkey: 'commentmock1',
    content: 'This is an amazing project! Really excited to see where this goes. 🚀',
    createdAt: Date.now() / 1000 - 86400,
  },
  {
    eventId: 'mock-comment-2',
    targetEventId: '',
    authorPubkey: 'commentmock2',
    content: 'Just contributed! Keep up the great work! ⚡',
    createdAt: Date.now() / 1000 - 43200,
  },
];

export const mockCommentProfiles = [
  {
    pubkey: 'commentmock1',
    name: 'Sarah',
    displayName: 'Sarah Johnson',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    pubkey: 'commentmock2',
    name: 'Mike',
    displayName: 'Mike Chen',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  },
];

export const useGoalComments = (goalEventId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Add mock comments
    const mockedComments = mockComments.map(c => ({
      ...c,
      targetEventId: goalEventId,
    }));
    setComments(mockedComments);

    // Add mock profiles
    mockCommentProfiles.forEach(profile => {
      dispatch(setProfile({ pubkey: profile.pubkey, profile }));
    });

    let commentSub: NDKSubscription | null = null;

    const subscribeToComments = async () => {
      try {
        const ndk = getNDK();
        const commentFilter: NDKFilter = {
          kinds: [1],
          '#e': [goalEventId],
          limit: 100,
        };

        commentSub = ndk.subscribe(commentFilter, { closeOnEose: false });

        commentSub.on('event', (event: NDKEvent) => {
          const comment = parseComment(event);
          if (comment) {
            setComments(prev => {
              const exists = prev.some(c => c.eventId === comment.eventId);
              return exists ? prev : [...prev, comment].sort((a, b) => b.createdAt - a.createdAt);
            });

            // Subscribe to commenter profile
            const profileFilter: NDKFilter = {
              kinds: [0],
              authors: [comment.authorPubkey],
            };
            const profileSub = ndk.subscribe(profileFilter, { closeOnEose: true });
            profileSub.on('event', (profileEvent: NDKEvent) => {
              try {
                const profile = JSON.parse(profileEvent.content);
                dispatch(setProfile({
                  pubkey: profileEvent.pubkey,
                  profile: { pubkey: profileEvent.pubkey, ...profile }
                }));
              } catch (error) {
                console.error('Failed to parse profile:', error);
              }
            });
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to comments:', error);
      }
    };

    subscribeToComments();

    return () => {
      commentSub?.stop();
    };
  }, [goalEventId, dispatch]);

  return comments;
};
