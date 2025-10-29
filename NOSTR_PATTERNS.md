# Nostr Event Patterns in ZapGoal

This document explains the Nostr event patterns used in this project with real examples.

## 📋 Table of Contents
1. [Event Structure Basics](#event-structure-basics)
2. [Kind 9041: Fundraising Goal](#kind-9041-fundraising-goal)
3. [Kind 9735: Zap Receipt](#kind-9735-zap-receipt)
4. [Kind 1: Comment/Update](#kind-1-commentupdate)
5. [Kind 7: Reaction](#kind-7-reaction)
6. [Kind 0: User Profile](#kind-0-user-profile)
7. [How to Create Events](#how-to-create-events)
8. [How to Query Events](#how-to-query-events)

---

## Event Structure Basics

Every Nostr event has this structure:
```json
{
  "id": "unique-event-id-hex",
  "pubkey": "author-public-key-hex",
  "created_at": 1234567890,
  "kind": 1,
  "tags": [],
  "content": "Event content",
  "sig": "signature-hex"
}
```

### Key Fields
- **`id`**: Unique identifier (SHA256 hash of event data)
- **`pubkey`**: Author's public key (64-char hex)
- **`created_at`**: Unix timestamp
- **`kind`**: Event type (defines what the event represents)
- **`tags`**: Array of arrays (creates relationships between events)
- **`content`**: The actual content (text, JSON, etc.)
- **`sig`**: Cryptographic signature proving authenticity

---

## Kind 9041: Fundraising Goal

**Purpose:** Represents a fundraising campaign

### Example Event
```json
{
  "kind": 9041,
  "pubkey": "abc123...",
  "created_at": 1730000000,
  "content": "Help me build a Nostr client!",
  "tags": [
    ["d", "goal-2024-nostr-client"],        // Unique goal ID
    ["title", "Nostr Client Development"],  // Goal title
    ["amount", "1000000", "btc"],          // Target: 1M sats
    ["image", "https://...image.jpg"],     // Cover image
    ["status", "open"]                     // open/closed/completed
  ]
}
```

### Creating a Goal
```typescript
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { getNDK } from '@/lib/ndk';

const createGoal = async () => {
  const ndk = getNDK();
  const event = new NDKEvent(ndk);
  
  event.kind = 9041;
  event.content = "My fundraising campaign description";
  event.tags = [
    ["d", `goal-${Date.now()}`],              // Unique ID
    ["title", "Build a Bitcoin App"],
    ["amount", "500000", "btc"],              // 500k sats target
    ["image", "https://example.com/img.jpg"],
    ["status", "open"]
  ];
  
  await event.publish();
  console.log("Goal created:", event.id);
};
```

### Parsing in Code
See `src/lib/nostrHelpers.ts` → `parseGoal9041()`

---

## Kind 9735: Zap Receipt

**Purpose:** Proof that someone sent Bitcoin to a goal

### Example Event
```json
{
  "kind": 9735,
  "pubkey": "relay-pubkey...",
  "created_at": 1730000000,
  "content": "Zap receipt",
  "tags": [
    ["p", "recipient-pubkey"],           // Who received the zap
    ["e", "goal-event-id"],              // Which goal was zapped
    ["bolt11", "lnbc10u1..."],           // Lightning invoice
    ["description", "{\"amount\":1000}"], // Zap amount in msat
    ["preimage", "proof-hex"]            // Payment proof
  ]
}
```

### How Zaps Work
1. User clicks "Zap" button on a goal
2. App generates Lightning invoice for goal author
3. User pays invoice with Lightning wallet
4. Lightning node publishes Kind 9735 receipt to Nostr
5. Our app subscribes to these receipts and counts them

### Finding Zaps for a Goal
```typescript
const ndk = getNDK();
const subscription = ndk.subscribe({
  kinds: [9735],
  '#e': [goalEventId],  // Filter by goal event ID
});

subscription.on('event', (event) => {
  const zap = parseZap9735(event);
  console.log(`Received ${zap.amountMsat / 1000} sats`);
});
```

### Parsing in Code
See `src/lib/nostrHelpers.ts` → `parseZap9735()`

---

## Kind 1: Comment/Update

**Purpose:** Text notes (comments on goals, or goal updates)

### Example: Comment on Goal
```json
{
  "kind": 1,
  "pubkey": "commenter-pubkey...",
  "created_at": 1730000000,
  "content": "Great goal! Just zapped you 10k sats!",
  "tags": [
    ["e", "goal-event-id", "", "root"],  // References goal
    ["p", "goal-author-pubkey"]          // Mentions goal author
  ]
}
```

### Example: Goal Update (from author)
```json
{
  "kind": 1,
  "pubkey": "goal-author-pubkey...",
  "created_at": 1730000000,
  "content": "Update: We reached 50% of our goal! Thank you!",
  "tags": [
    ["e", "goal-event-id", "", "root"]   // Links to goal
  ]
}
```

### Creating a Comment
```typescript
const postComment = async (goalEventId: string, goalAuthorPubkey: string, text: string) => {
  const ndk = getNDK();
  const event = new NDKEvent(ndk);
  
  event.kind = 1;
  event.content = text;
  event.tags = [
    ["e", goalEventId, "", "root"],    // Root = top-level comment
    ["p", goalAuthorPubkey]            // Notify goal author
  ];
  
  await event.publish();
};
```

### Creating a Reply to Comment
```typescript
const replyToComment = async (
  parentCommentId: string, 
  parentAuthorPubkey: string,
  goalEventId: string,
  text: string
) => {
  const ndk = getNDK();
  const event = new NDKEvent(ndk);
  
  event.kind = 1;
  event.content = text;
  event.tags = [
    ["e", goalEventId, "", "root"],          // Original goal
    ["e", parentCommentId, "", "reply"],     // Comment being replied to
    ["p", parentAuthorPubkey]                // Notify parent author
  ];
  
  await event.publish();
};
```

### Tag Markers Explained
- **`root`**: References the original/top-level event
- **`reply`**: References the direct parent comment
- **`mention`**: Just mentioning an event (not replying)

---

## Kind 7: Reaction

**Purpose:** Like/dislike or emoji reactions

### Example: Like
```json
{
  "kind": 7,
  "pubkey": "reactor-pubkey...",
  "created_at": 1730000000,
  "content": "+",                    // "+" or "" = like
  "tags": [
    ["e", "goal-event-id"],         // Event being reacted to
    ["p", "goal-author-pubkey"]     // Event author
  ]
}
```

### Example: Dislike
```json
{
  "kind": 7,
  "content": "-",                    // "-" = dislike
  "tags": [
    ["e", "goal-event-id"],
    ["p", "goal-author-pubkey"]
  ]
}
```

### Example: Emoji Reaction
```json
{
  "kind": 7,
  "content": "🚀",                   // Any emoji
  "tags": [
    ["e", "goal-event-id"],
    ["p", "goal-author-pubkey"]
  ]
}
```

### Creating a Reaction
```typescript
const addReaction = async (goalEventId: string, goalAuthorPubkey: string, emoji: string) => {
  const ndk = getNDK();
  const event = new NDKEvent(ndk);
  
  event.kind = 7;
  event.content = emoji;  // "+", "-", or any emoji
  event.tags = [
    ["e", goalEventId],
    ["p", goalAuthorPubkey]
  ];
  
  await event.publish();
};
```

---

## Kind 0: User Profile

**Purpose:** User metadata (name, picture, bio)

### Example Event
```json
{
  "kind": 0,
  "pubkey": "user-pubkey...",
  "created_at": 1730000000,
  "content": "{
    \"name\": \"Alice\",
    \"display_name\": \"Alice 🚀\",
    \"picture\": \"https://example.com/avatar.jpg\",
    \"about\": \"Bitcoin developer\",
    \"lud16\": \"alice@getalby.com\"
  }",
  "tags": []
}
```

### Updating Your Profile
```typescript
const updateProfile = async (profileData: {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  lud16?: string;  // Lightning address
}) => {
  const ndk = getNDK();
  const event = new NDKEvent(ndk);
  
  event.kind = 0;
  event.content = JSON.stringify(profileData);
  event.tags = [];
  
  await event.publish();
};
```

---

## How to Create Events

### Step-by-Step Process

```typescript
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { getNDK } from '@/lib/ndk';

// 1. Get NDK instance (must be initialized first)
const ndk = getNDK();

// 2. Create new event
const event = new NDKEvent(ndk);

// 3. Set kind (defines event type)
event.kind = 1;  // Text note

// 4. Set content
event.content = "Hello Nostr!";

// 5. Add tags (optional but important for relationships)
event.tags = [
  ["e", "some-event-id"],  // References another event
  ["p", "some-pubkey"]     // Tags another user
];

// 6. Publish to relays (automatically signs with your key)
try {
  await event.publish();
  console.log("✅ Published:", event.id);
} catch (error) {
  console.error("❌ Failed to publish:", error);
}
```

### Common Pitfalls

❌ **Wrong:**
```typescript
// NDK not initialized
const event = new NDKEvent(null);
```

✅ **Correct:**
```typescript
const ndk = getNDK();
const event = new NDKEvent(ndk);
```

❌ **Wrong:**
```typescript
// Tags as flat array
event.tags = ["e", goalEventId];
```

✅ **Correct:**
```typescript
// Tags as array of arrays
event.tags = [["e", goalEventId]];
```

---

## How to Query Events

### Basic Query
```typescript
const ndk = getNDK();
const subscription = ndk.subscribe({
  kinds: [1],      // Kind 1 events (text notes)
  limit: 20        // Max 20 events
});

subscription.on('event', (event: NDKEvent) => {
  console.log("Received:", event.content);
});
```

### Query by Author
```typescript
const subscription = ndk.subscribe({
  kinds: [9041],
  authors: ["pubkey-hex"],  // Only goals from this user
});
```

### Query by Tag
```typescript
// Find all comments on a goal
const subscription = ndk.subscribe({
  kinds: [1],
  '#e': [goalEventId],  // Events that reference this goal
});
```

### Query Multiple Kinds
```typescript
const subscription = ndk.subscribe({
  kinds: [1, 7],  // Comments AND reactions
  '#e': [goalEventId]
});
```

### Query with Time Range
```typescript
const subscription = ndk.subscribe({
  kinds: [9041],
  since: Math.floor(Date.now() / 1000) - 86400,  // Last 24h
  until: Math.floor(Date.now() / 1000)
});
```

### Stop Subscription
```typescript
// When component unmounts
subscription.stop();
```

---

## Real-World Examples from ZapGoal

### Example 1: Subscribe to All Goals
```typescript
// From: src/hooks/useGoalsSubscription.ts
const goalsSub = ndk.subscribe({
  kinds: [9041],
  limit: 100
}, { closeOnEose: false });

goalsSub.on('event', (event: NDKEvent) => {
  const goal = parseGoal9041(event);
  if (goal) {
    dispatch(addGoal(goal));
  }
});
```

### Example 2: Get Zaps for Specific Goals
```typescript
// From: src/hooks/useGoalsSubscription.ts
const goalEventIds = goals.map(g => g.eventId);

const zapsSub = ndk.subscribe({
  kinds: [9735],
  '#e': goalEventIds,  // Zaps for these specific goals
  limit: 10000
});

zapsSub.on('event', (event: NDKEvent) => {
  const zap = parseZap9735(event);
  if (zap?.targetEventId) {
    dispatch(addZap(zap));
  }
});
```

### Example 3: Get Comments on a Goal
```typescript
// From: src/hooks/useGoalComments.ts
const commentFilter = {
  kinds: [1],
  authors: [authorPubkey],  // From goal author
  '#e': [goalEventId],      // Referencing this goal
  limit: 50
};

const sub = ndk.subscribe(commentFilter);
sub.on('event', (event: NDKEvent) => {
  const comment = parseComment(event);
  setComments(prev => [...prev, comment]);
});
```

---

## 🎓 Understanding Tag Queries

### Tag Query Syntax: `#<tag-name>`

```typescript
// Find events with 'e' tag containing goalEventId
'#e': [goalEventId]

// Find events with 'p' tag containing userPubkey
'#p': [userPubkey]

// Find events with 'd' tag containing goalId
'#d': [goalId]

// Multiple values (OR logic)
'#e': [goalId1, goalId2, goalId3]
```

### Common Tag Patterns

| Pattern | Meaning | Use Case |
|---------|---------|----------|
| `['e', eventId]` | References an event | Comments, reactions, replies |
| `['p', pubkey]` | Mentions a user | Notifications, tags |
| `['d', identifier]` | Unique ID | Replaceable events (profiles, goals) |
| `['amount', sats]` | Amount in sats | Goal targets |
| `['bolt11', invoice]` | Lightning invoice | Zap receipts |

---

## 🔍 Debugging Tips

### View Raw Events in Console
```typescript
subscription.on('event', (event: NDKEvent) => {
  console.log("Raw event:", {
    kind: event.kind,
    content: event.content,
    tags: event.tags,
    pubkey: event.pubkey
  });
});
```

### Check if Event Was Published
```typescript
try {
  await event.publish();
  console.log("✅ Published:", event.id);
  console.log("View on relay:", `https://relay.tools/${event.id}`);
} catch (error) {
  console.error("❌ Failed:", error);
}
```

### Monitor WebSocket Traffic
1. Open DevTools → Network tab
2. Filter by "WS"
3. Click on a relay connection
4. Watch JSON events in real-time

---

## 📚 Further Reading

- **NIP-01** (Basic Protocol): https://github.com/nostr-protocol/nips/blob/master/01.md
- **NIP-25** (Reactions): https://github.com/nostr-protocol/nips/blob/master/25.md
- **NIP-57** (Lightning Zaps): https://github.com/nostr-protocol/nips/blob/master/57.md
- **NDK Docs**: https://github.com/nostr-dev-kit/ndk

---

**Next Step:** Read `DEVELOPER_GUIDE.md` to understand how these patterns are used in the ZapGoal codebase.
