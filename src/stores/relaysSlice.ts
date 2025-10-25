import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RelayStatus {
  url: string;
  connected: boolean;
}

interface RelaysState {
  relays: string[];
  relayStatuses: RelayStatus[];
}

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr.wine',
  'wss://relay.primal.net',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.nostr.band',
  'wss://eden.nostr.land',
  'wss://nostr.fmt.wiz.biz',
  'wss://relay.orangepill.dev',
  'wss://nostr-pub.wellorder.net',
];

const initialState: RelaysState = {
  relays: DEFAULT_RELAYS,
  relayStatuses: [],
};

const relaysSlice = createSlice({
  name: 'relays',
  initialState,
  reducers: {
    addRelay: (state, action: PayloadAction<string>) => {
      state.relays.push(action.payload);
    },
    removeRelay: (state, action: PayloadAction<string>) => {
      state.relays = state.relays.filter((r) => r !== action.payload);
      // Also remove its status
      state.relayStatuses = state.relayStatuses.filter((r) => r.url !== action.payload);
    },
    updateRelayStatus: (state, action: PayloadAction<{ url: string; connected: boolean }>) => {
      // Only track status for configured relays
      if (!state.relays.includes(action.payload.url)) {
        return;
      }
      
      const existing = state.relayStatuses.find((r) => r.url === action.payload.url);
      if (existing) {
        existing.connected = action.payload.connected;
      } else {
        state.relayStatuses.push({ url: action.payload.url, connected: action.payload.connected });
      }
      
      // Clean up statuses for relays no longer configured
      state.relayStatuses = state.relayStatuses.filter((status) => 
        state.relays.includes(status.url)
      );
    },
    mergeDefaultRelays: (state) => {
      // Add any default relays that aren't already in the list
      const uniqueRelays = new Set(state.relays);
      DEFAULT_RELAYS.forEach(relay => {
        if (!uniqueRelays.has(relay)) {
          state.relays.push(relay);
        }
      });
    },
    resetToDefaultRelays: (state) => {
      state.relays = [...DEFAULT_RELAYS];
      state.relayStatuses = [];
    },
  },
});

export const { addRelay, removeRelay, updateRelayStatus, mergeDefaultRelays, resetToDefaultRelays } = relaysSlice.actions;
export default relaysSlice.reducer;
