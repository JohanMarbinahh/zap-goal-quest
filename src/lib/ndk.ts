import NDK, { NDKEvent, NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { useRelaysStore } from '@/stores/relaysStore';
import { useAuthStore } from '@/stores/authStore';
import { nip19 } from 'nostr-tools';

let ndkInstance: NDK | null = null;

export async function initNDK() {
  const relays = useRelaysStore.getState().relays;
  
  ndkInstance = new NDK({
    explicitRelayUrls: relays,
  });

  // Set up relay status tracking
  ndkInstance.pool.on('relay:connect', (relay) => {
    useRelaysStore.getState().updateRelayStatus(relay.url, true);
  });

  ndkInstance.pool.on('relay:disconnect', (relay) => {
    useRelaysStore.getState().updateRelayStatus(relay.url, false);
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
  const authStore = useAuthStore.getState();

  // Try NIP-07 first
  if (window.nostr) {
    try {
      const signer = new NDKNip07Signer();
      ndk.signer = signer;
      
      const user = await signer.user();
      const npub = nip19.npubEncode(user.pubkey);
      
      authStore.setPubkey(user.pubkey, npub, true);
      return { pubkey: user.pubkey, npub, isNip07: true };
    } catch (error) {
      console.error('NIP-07 auth failed:', error);
    }
  }

  // Fallback to ephemeral key
  let ephemeralKey = authStore.ephemeralKey;
  if (!ephemeralKey) {
    const privateKey = NDKPrivateKeySigner.generate();
    ephemeralKey = privateKey.privateKey!;
    authStore.setEphemeralKey(ephemeralKey);
  }

  const signer = new NDKPrivateKeySigner(ephemeralKey);
  ndk.signer = signer;
  
  const user = await signer.user();
  const npub = nip19.npubEncode(user.pubkey);
  
  authStore.setPubkey(user.pubkey, npub, false);
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
