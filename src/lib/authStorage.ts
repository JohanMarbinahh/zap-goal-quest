const AUTH_STORAGE_KEY = 'nostr_auth';

interface StoredAuth {
  pubkey: string;
  npub: string;
  privateKey: string;
}

export const saveAuthToStorage = (pubkey: string, npub: string, privateKey: string) => {
  const authData: StoredAuth = { pubkey, npub, privateKey };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
};

export const loadAuthFromStorage = (): StoredAuth | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredAuth;
  } catch (error) {
    console.error('Failed to load auth from storage:', error);
    return null;
  }
};

export const clearAuthFromStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
