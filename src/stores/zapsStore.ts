import { create } from 'zustand';
import { Zap9735 } from '@/types/nostr';

interface ZapsState {
  zapsByGoal: Map<string, Zap9735[]>;
  zapsByPubkey: Map<string, Zap9735[]>;
  addZap: (zap: Zap9735) => void;
  getZapsForGoal: (eventId: string) => Zap9735[];
  getZapsForPubkey: (pubkey: string) => Zap9735[];
  getRaisedForGoal: (eventId: string, excludeSelfZaps?: boolean, creatorPubkey?: string) => number;
  getRaisedForCreator: (pubkey: string) => number;
  getTopSupporters: (eventId: string, excludeSelfZaps?: boolean, creatorPubkey?: string) => Array<{ pubkey: string; total: number; count: number }>;
}

export const useZapsStore = create<ZapsState>((set, get) => ({
  zapsByGoal: new Map(),
  zapsByPubkey: new Map(),
  
  addZap: (zap) =>
    set((state) => {
      const newZapsByGoal = new Map(state.zapsByGoal);
      const newZapsByPubkey = new Map(state.zapsByPubkey);

      // Add to goal zaps
      if (zap.targetEventId) {
        const existing = newZapsByGoal.get(zap.targetEventId) || [];
        newZapsByGoal.set(zap.targetEventId, [...existing, zap]);
      }

      // Add to pubkey zaps
      if (zap.recipientPubkey) {
        const existing = newZapsByPubkey.get(zap.recipientPubkey) || [];
        newZapsByPubkey.set(zap.recipientPubkey, [...existing, zap]);
      }

      return { zapsByGoal: newZapsByGoal, zapsByPubkey: newZapsByPubkey };
    }),

  getZapsForGoal: (eventId) => get().zapsByGoal.get(eventId) || [],
  
  getZapsForPubkey: (pubkey) => get().zapsByPubkey.get(pubkey) || [],

  getRaisedForGoal: (eventId, excludeSelfZaps = false, creatorPubkey) => {
    const zaps = get().getZapsForGoal(eventId);
    return zaps
      .filter((z) => !excludeSelfZaps || z.zapperPubkey !== creatorPubkey)
      .reduce((sum, z) => sum + (z.amountMsat / 1000), 0);
  },

  getRaisedForCreator: (pubkey) => {
    const zaps = get().getZapsForPubkey(pubkey);
    return zaps.reduce((sum, z) => sum + (z.amountMsat / 1000), 0);
  },

  getTopSupporters: (eventId, excludeSelfZaps = false, creatorPubkey) => {
    const zaps = get().getZapsForGoal(eventId)
      .filter((z) => !excludeSelfZaps || z.zapperPubkey !== creatorPubkey);
    
    const grouped = zaps.reduce((acc, z) => {
      const key = z.zapperPubkey || 'anonymous';
      if (!acc[key]) {
        acc[key] = { pubkey: key, total: 0, count: 0 };
      }
      acc[key].total += z.amountMsat / 1000;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { pubkey: string; total: number; count: number }>);

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  },
}));
