import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { store } from '@/stores/store';
import { updateRelayStatus } from '@/stores/relaysSlice';
import { setPubkey } from '@/stores/authSlice';
import { nip19 } from 'nostr-tools';

let ndkInstance: NDK | null = null;

export async function initNDK() {
  const relays = store.getState().relays.relays;

  ndkInstance = new NDK({
    explicitRelayUrls: relays,
  });

  // Set up relay status tracking - only for configured relays
  ndkInstance.pool.on('relay:connect', (relay) => {
    store.dispatch(updateRelayStatus({ url: relay.url, connected: true }));
  });

  ndkInstance.pool.on('relay:disconnect', (relay) => {
    store.dispatch(updateRelayStatus({ url: relay.url, connected: false }));
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
  const authState = store.getState().auth;

  // If already authenticated with private key, restore signer
  if (authState.pubkey && authState.privateKey) {
    try {
      const signer = new NDKPrivateKeySigner(authState.privateKey);
      ndk.signer = signer;
      console.log('✅ Restored signer for pubkey:', authState.pubkey.slice(0, 8));
      return { pubkey: authState.pubkey, npub: authState.npub };
    } catch (error) {
      console.error('Failed to restore signer:', error);
      // Clear invalid auth state
      store.dispatch(setPubkey({ pubkey: '', npub: '', privateKey: '' }));
    }
  }

  return null;
}

export async function loginWithPrivateKey(privateKey: string) {
  const ndk = getNDK();
  
  try {
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

    store.dispatch(setPubkey({ pubkey: user.pubkey, npub, privateKey: hexKey }));
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
