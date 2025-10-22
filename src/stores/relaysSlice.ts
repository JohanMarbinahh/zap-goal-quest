import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RelayStatus {
  url: string;
  connected: boolean;
}

interface RelaysState {
  relays: string[];
  relayStatuses: RelayStatus[];
}

const initialState: RelaysState = {
  relays: [
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
  ],
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
    },
    updateRelayStatus: (state, action: PayloadAction<{ url: string; connected: boolean }>) => {
      const existing = state.relayStatuses.find((r) => r.url === action.payload.url);
      if (existing) {
        existing.connected = action.payload.connected;
      } else {
        state.relayStatuses.push({ url: action.payload.url, connected: action.payload.connected });
      }
    },
  },
});

export const { addRelay, removeRelay, updateRelayStatus } = relaysSlice.actions;
export default relaysSlice.reducer;
