export interface Profile {
  pubkey: string;
  name?: string;
  displayName?: string;
  display_name?: string;
  picture?: string;
  lud16?: string;
  about?: string;
}

export interface Goal9041 {
  eventId: string;
  goalId: string; // d tag
  authorPubkey: string;
  title?: string;
  name?: string;
  targetSats: number;
  status?: string;
  createdAt: number;
  imageUrl?: string;
  summary?: string;
}

export interface Zap9735 {
  eventId: string;
  createdAt: number;
  amountMsat: number;
  recipientPubkey?: string; // from #p
  targetEventId?: string; // from #e
  zapperPubkey?: string;
  memo?: string;
}

export interface Reaction7 {
  eventId: string;
  createdAt: number;
  targetEventId: string;
  reactorPubkey: string;
  content: string;
}
