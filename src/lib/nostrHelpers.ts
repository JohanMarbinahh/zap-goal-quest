import { NDKEvent } from '@nostr-dev-kit/ndk';
import { Goal9041, Profile, Zap9735, Reaction7 } from '@/types/nostr';

export function parseProfile(event: NDKEvent): Profile | null {
  try {
    const content = JSON.parse(event.content);
    return {
      pubkey: event.pubkey,
      name: content.name,
      displayName: content.display_name || content.displayName,
      display_name: content.display_name || content.displayName,
      picture: content.picture,
      lud16: content.lud16,
      about: content.about,
    };
  } catch (error) {
    console.error('Failed to parse profile:', error);
    return null;
  }
}

export function parseGoal9041(event: NDKEvent): Goal9041 | null {
  try {
    const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
    if (!dTag) return null;

    // Parse target from tags
    const goalTag = event.tags.find((t) => t[0] === 'goal');
    const amountTag = event.tags.find((t) => t[0] === 'amount');
    
    let targetSats = 0;
    if (goalTag && goalTag[1] === 'sats') {
      targetSats = parseInt(goalTag[2] || '0', 10);
    } else if (amountTag) {
      targetSats = parseInt(amountTag[1] || '0', 10);
    }

    // Try to parse content as JSON for additional metadata
    let title = '';
    let imageUrl = '';
    let status = 'active';
    
    try {
      const content = JSON.parse(event.content);
      title = content.title || content.name || '';
      imageUrl = content.image || content.imageUrl || '';
      status = content.status || 'active';
    } catch {
      title = event.content || 'Untitled Goal';
    }

    return {
      eventId: event.id,
      goalId: dTag,
      authorPubkey: event.pubkey,
      title,
      name: title,
      targetSats,
      status,
      createdAt: event.created_at || Date.now() / 1000,
      imageUrl,
    };
  } catch (error) {
    console.error('Failed to parse goal:', error);
    return null;
  }
}

export function parseZap9735(event: NDKEvent): Zap9735 | null {
  try {
    const pTag = event.tags.find((t) => t[0] === 'p')?.[1];
    const eTag = event.tags.find((t) => t[0] === 'e')?.[1];
    const boltTag = event.tags.find((t) => t[0] === 'bolt11')?.[1];

    // Parse description JSON for zapper and memo
    const descTag = event.tags.find((t) => t[0] === 'description')?.[1];
    let zapperPubkey = '';
    let memo = '';
    let amountMsat = 0;

    if (descTag) {
      try {
        const desc = JSON.parse(descTag);
        zapperPubkey = desc.pubkey || '';
        memo = desc.content || '';
      } catch (e) {
        console.error('Failed to parse zap description:', e);
      }
    }

    // Try to get amount from bolt11 or tags
    const amountTag = event.tags.find((t) => t[0] === 'amount')?.[1];
    if (amountTag) {
      amountMsat = parseInt(amountTag, 10);
    }

    // TODO: Parse bolt11 for amount if not in tags
    if (amountMsat === 0 && boltTag) {
      // Placeholder - would need bolt11 parser
      console.log('TODO: Parse bolt11 for amount');
    }

    return {
      eventId: event.id,
      createdAt: event.created_at || Date.now() / 1000,
      amountMsat,
      recipientPubkey: pTag,
      targetEventId: eTag,
      zapperPubkey,
      memo,
    };
  } catch (error) {
    console.error('Failed to parse zap:', error);
    return null;
  }
}

export function parseReaction7(event: NDKEvent): Reaction7 | null {
  try {
    const eTag = event.tags.find((t) => t[0] === 'e')?.[1];
    if (!eTag) return null;

    return {
      eventId: event.id,
      createdAt: event.created_at || Date.now() / 1000,
      targetEventId: eTag,
      reactorPubkey: event.pubkey,
      content: event.content,
    };
  } catch (error) {
    console.error('Failed to parse reaction:', error);
    return null;
  }
}

export function formatSats(sats: number): string {
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(2)}M`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(1)}K`;
  }
  return sats.toFixed(0);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}
