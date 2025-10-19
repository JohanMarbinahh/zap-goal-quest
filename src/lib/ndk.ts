import NDK, { NDKEvent, NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { store } from '@/stores/store';
import { updateRelayStatus } from '@/stores/relaysSlice';
import { setPubkey, setEphemeralKey } from '@/stores/authSlice';
import { nip19 } from 'nostr-tools';

let ndkInstance: NDK | null = null;

export async function initNDK() {
  const relays = store.getState().relays.relays;
  
  ndkInstance = new NDK({
    explicitRelayUrls: relays,
  });

  // Set up relay status tracking
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

  // Try NIP-07 first
  if (window.nostr) {
    try {
      const signer = new NDKNip07Signer();
      ndk.signer = signer;
      
      const user = await signer.user();
      const npub = nip19.npubEncode(user.pubkey);
      
      store.dispatch(setPubkey({ pubkey: user.pubkey, npub, isNip07: true }));
      return { pubkey: user.pubkey, npub, isNip07: true };
    } catch (error) {
      console.error('NIP-07 auth failed:', error);
    }
  }

  // Fallback to ephemeral key
  let ephemeralKey = authState.ephemeralKey;
  if (!ephemeralKey) {
    const privateKey = NDKPrivateKeySigner.generate();
    ephemeralKey = privateKey.privateKey!;
    store.dispatch(setEphemeralKey(ephemeralKey));
  }

  const signer = new NDKPrivateKeySigner(ephemeralKey);
  ndk.signer = signer;
  
  const user = await signer.user();
  const npub = nip19.npubEncode(user.pubkey);
  
  store.dispatch(setPubkey({ pubkey: user.pubkey, npub, isNip07: false }));
  return { pubkey: user.pubkey, npub, isNip07: false };
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
