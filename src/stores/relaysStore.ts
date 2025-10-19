import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RelayStatus {
  url: string;
  connected: boolean;
}

interface RelaysState {
  relays: string[];
  relayStatuses: RelayStatus[];
  addRelay: (url: string) => void;
  removeRelay: (url: string) => void;
  updateRelayStatus: (url: string, connected: boolean) => void;
}

export const useRelaysStore = create<RelaysState>()(
  persist(
    (set) => ({
      relays: [
        'wss://relay.damus.io',
        'wss://nostr.wine',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ],
      relayStatuses: [],
      addRelay: (url) =>
        set((state) => ({
          relays: [...state.relays, url],
        })),
      removeRelay: (url) =>
        set((state) => ({
          relays: state.relays.filter((r) => r !== url),
        })),
      updateRelayStatus: (url, connected) =>
        set((state) => {
          const existing = state.relayStatuses.find((r) => r.url === url);
          if (existing) {
            return {
              relayStatuses: state.relayStatuses.map((r) =>
                r.url === url ? { ...r, connected } : r
              ),
            };
          }
          return {
            relayStatuses: [...state.relayStatuses, { url, connected }],
          };
        }),
    }),
    {
      name: 'zapgoal-relays',
    }
  )
);
