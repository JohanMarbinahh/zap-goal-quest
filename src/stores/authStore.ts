import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  pubkey: string | null;
  npub: string | null;
  isNip07: boolean;
  ephemeralKey: string | null;
  setPubkey: (pubkey: string, npub: string, isNip07: boolean) => void;
  setEphemeralKey: (key: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      pubkey: null,
      npub: null,
      isNip07: false,
      ephemeralKey: null,
      setPubkey: (pubkey, npub, isNip07) => set({ pubkey, npub, isNip07 }),
      setEphemeralKey: (key) => set({ ephemeralKey: key }),
      logout: () => set({ pubkey: null, npub: null, isNip07: false }),
    }),
    {
      name: 'zapgoal-auth',
    }
  )
);
