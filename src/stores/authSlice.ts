import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  pubkey: string | null;
  npub: string | null;
}

const initialState: AuthState = {
  pubkey: null,
  npub: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPubkey: (state, action: PayloadAction<{ pubkey: string; npub: string }>) => {
      state.pubkey = action.payload.pubkey;
      state.npub = action.payload.npub;
    },

    logout: (state) => {
      state.pubkey = null;
      state.npub = null;
    },
  },
});

export const { setPubkey, logout } = authSlice.actions;
export default authSlice.reducer;
