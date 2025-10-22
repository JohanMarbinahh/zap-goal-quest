import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContactsState {
  following: Record<string, string[]>; // pubkey -> array of followed pubkeys
}

const initialState: ContactsState = {
  following: {},
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setFollowing: (state, action: PayloadAction<{ pubkey: string; following: string[] }>) => {
      state.following[action.payload.pubkey] = action.payload.following;
    },
  },
});

export const { setFollowing } = contactsSlice.actions;
export default contactsSlice.reducer;
