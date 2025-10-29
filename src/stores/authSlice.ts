import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  pubkey: string | null;
  npub: string | null;
  privateKey: string | null; // Store encrypted private key
}

const initialState: AuthState = {
  pubkey: null,
  npub: null,
  privateKey: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPubkey: (state, action: PayloadAction<{ pubkey: string; npub: string; privateKey?: string }>) => {
      state.pubkey = action.payload.pubkey;
      state.npub = action.payload.npub;
      if (action.payload.privateKey) {
        state.privateKey = action.payload.privateKey;
      }
    },

    logout: (state) => {
      state.pubkey = null;
      state.npub = null;
      state.privateKey = null;
    },
  },
});

export const { setPubkey, logout } = authSlice.actions;
export default authSlice.reducer;
