import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { store } from '@/stores/store';
import { updateRelayStatus, mergeDefaultRelays } from '@/stores/relaysSlice';
import { setPubkey } from '@/stores/authSlice';
import { nip19 } from 'nostr-tools';
import { saveAuthToStorage, loadAuthFromStorage } from './authStorage';

let ndkInstance: NDK | null = null;

export async function initNDK() {
  // If already initialized, return existing instance
  if (ndkInstance) {
    console.log('✅ NDK already initialized, returning existing instance');
    return ndkInstance;
  }

  console.log('🔧 Initializing NDK for the first time');
  
  // Ensure default relays are merged with persisted ones
  store.dispatch(mergeDefaultRelays());
  const relays = store.getState().relays.relays;

  ndkInstance = new NDK({
    explicitRelayUrls: relays,
  });

  // Set up relay status tracking - only for configured relays
  ndkInstance.pool.on('relay:connect', (relay) => {
    const normalizedUrl = relay.url.replace(/\/$/, ''); // Remove trailing slash
    const configuredRelays = store.getState().relays.relays;
    
    // Only track status for configured relays
    if (configuredRelays.includes(normalizedUrl)) {
      store.dispatch(updateRelayStatus({ url: normalizedUrl, connected: true }));
    }
  });

  ndkInstance.pool.on('relay:disconnect', (relay) => {
    const normalizedUrl = relay.url.replace(/\/$/, ''); // Remove trailing slash
    const configuredRelays = store.getState().relays.relays;
    
    // Only track status for configured relays
    if (configuredRelays.includes(normalizedUrl)) {
      store.dispatch(updateRelayStatus({ url: normalizedUrl, connected: false }));
    }
  });

  await ndkInstance.connect();
  return ndkInstance;
}

export function getNDK() {
  if (!ndkInstance) {
    throw new Error('NDK not initialized. Call initNDK() first.');
  }
  return ndkInstance;
}

export async function setupAuth() {
  const ndk = getNDK();
  
  // Try to load auth from localStorage first
  const storedAuth = loadAuthFromStorage();

  console.log('🔐 setupAuth called. Stored auth:', { 
    hasPubkey: !!storedAuth?.pubkey,
    pubkey: storedAuth?.pubkey?.slice(0, 8),
    hasPrivateKey: !!storedAuth?.privateKey,
    privateKeyLength: storedAuth?.privateKey?.length,
    currentSignerExists: !!ndk.signer
  });

  // If found in localStorage, restore signer and Redux state
  if (storedAuth && storedAuth.pubkey && storedAuth.privateKey) {
    try {
      const signer = new NDKPrivateKeySigner(storedAuth.privateKey);
      ndk.signer = signer;
      
      // Restore to Redux store
      store.dispatch(setPubkey({
        pubkey: storedAuth.pubkey,
        npub: storedAuth.npub,
        privateKey: storedAuth.privateKey,
      }));
      
      // Verify the signer works by getting the user
      const user = await signer.user();
      console.log('✅ Restored signer from localStorage for pubkey:', user.pubkey.slice(0, 8));
      
      return { pubkey: storedAuth.pubkey, npub: storedAuth.npub };
    } catch (error) {
      console.error('❌ Failed to restore signer:', error);
      // Clear invalid auth state
      store.dispatch(setPubkey({ pubkey: '', npub: '', privateKey: '' }));
    }
  } else {
    console.log('⚠️ No auth state to restore');
  }

  return null;
}

export async function loginWithPrivateKey(privateKey: string) {
  const ndk = getNDK();
  
  try {
    console.log('🔑 loginWithPrivateKey called');
    
    // Handle both nsec and hex formats
    let hexKey = privateKey;
    if (privateKey.startsWith('nsec')) {
      const decoded = nip19.decode(privateKey);
      if (decoded.type !== 'nsec') {
        throw new Error('Invalid nsec format');
      }
      // Convert Uint8Array to hex string
      const bytes = decoded.data as Uint8Array;
      hexKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const signer = new NDKPrivateKeySigner(hexKey);
    ndk.signer = signer;

    const user = await signer.user();
    const npub = nip19.npubEncode(user.pubkey);

    console.log('✅ Setting signer and storing auth data:', {
      pubkey: user.pubkey.slice(0, 8),
      npub: npub.slice(0, 12),
      privateKeyLength: hexKey.length,
      signerSet: !!ndk.signer
    });

    // Store in Redux and localStorage
    store.dispatch(setPubkey({ pubkey: user.pubkey, npub, privateKey: hexKey }));
    saveAuthToStorage(user.pubkey, npub, hexKey);
    
    // Verify it was stored
    const storedAuth = store.getState().auth;
    console.log('✅ Verified stored auth:', {
      hasPubkey: !!storedAuth.pubkey,
      hasPrivateKey: !!storedAuth.privateKey,
      privateKeyLength: storedAuth.privateKey?.length
    });
    
    return { pubkey: user.pubkey, npub };
  } catch (error) {
    console.error('Private key login failed:', error);
    throw new Error('Invalid private key format');
  }
}


export async function publishEvent(event: NDKEvent) {
  const ndk = getNDK();
  await event.sign();
  await event.publish();
  return event;
}

export function shortNpub(npub: string, length = 8) {
  if (!npub) return '';
  return `${npub.slice(0, length)}...${npub.slice(-4)}`;
}
