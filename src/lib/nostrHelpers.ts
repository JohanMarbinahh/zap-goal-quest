import { NDKEvent } from '@nostr-dev-kit/ndk';
import { Goal9041, Profile, Zap9735, Reaction7 } from '@/types/nostr';
import { decode } from 'light-bolt11-decoder';

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
    // d tag is preferred but not required - use event ID as fallback
    const dTag = event.tags.find((t) => t[0] === 'd')?.[1] || event.id;

    // Parse target from tags - be very flexible with tag names
    const goalTag = event.tags.find((t) => t[0] === 'goal');
    const amountTag = event.tags.find((t) => t[0] === 'amount');
    const closedTag = event.tags.find((t) => t[0] === 'closed_at');
    const imageTag = event.tags.find((t) => t[0] === 'image')?.[1];
    
    let targetSats = 0;
    
    // Try multiple ways to get target amount
    if (goalTag && goalTag[1] === 'sats' && goalTag[2]) {
      targetSats = parseInt(goalTag[2], 10);
    } else if (amountTag && amountTag[1]) {
      const amount = parseInt(amountTag[1], 10);
      // Handle msats (amounts > 1M are likely msats)
      targetSats = amount > 1000000 ? Math.floor(amount / 1000) : amount;
    } else if (goalTag && goalTag[1]) {
      // Sometimes the amount is directly in goalTag[1]
      const amount = parseInt(goalTag[1], 10);
      if (!isNaN(amount)) {
        targetSats = amount > 1000000 ? Math.floor(amount / 1000) : amount;
      }
    }
    
    // If still no target, set a default
    if (!targetSats || isNaN(targetSats)) {
      targetSats = 10000; // Default 10k sats
    }

    // Try to parse content for metadata
    let title = '';
    let summary = '';
    let imageUrl = imageTag || ''; // Start with image tag if exists
    let status = closedTag ? 'closed' : 'active';
    
    try {
      const content = JSON.parse(event.content);
      title = content.title || content.name || '';
      summary = content.summary || content.description || content.about || '';
      // Use content image if no tag image, or if content has one
      imageUrl = content.image || content.imageUrl || content.picture || imageUrl;
      status = content.status || status;
    } catch {
      // If content is not JSON, use it as title (clean it up)
      title = event.content?.trim() || '';
    }

    // If still no title, generate one from tags or content
    if (!title) {
      // Check for name or title in tags
      const nameTag = event.tags.find((t) => t[0] === 'name' || t[0] === 'title')?.[1];
      if (nameTag) {
        title = nameTag;
      } else if (dTag !== event.id) {
        // Use d tag if it looks like a readable title
        title = dTag.length < 50 ? dTag : `Goal ${dTag.substring(0, 15)}...`;
      } else {
        title = `Fundraiser ${event.id.substring(0, 8)}`;
      }
    }

    return {
      eventId: event.id,
      goalId: dTag,
      authorPubkey: event.pubkey,
      title: title.substring(0, 200), // Limit title length
      name: title.substring(0, 200),
      targetSats,
      status,
      createdAt: event.created_at || Date.now() / 1000,
      imageUrl,
      summary: summary.substring(0, 500), // Limit summary length
    };
  } catch (error) {
    console.error('Failed to parse goal:', error, event);
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

    // Parse bolt11 invoice for amount if not in tags
    if (amountMsat === 0 && boltTag) {
      try {
        const decoded = decode(boltTag);
        const amountSection = decoded.sections.find((s: any) => s.name === 'amount');
        if (amountSection && 'value' in amountSection) {
          // light-bolt11-decoder returns amount in millisatoshis
          amountMsat = parseInt(String(amountSection.value), 10);
        }
      } catch (e) {
        console.error('Failed to parse bolt11 invoice:', e);
      }
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
