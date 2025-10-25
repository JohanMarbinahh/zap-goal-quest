# Zap Matching Logic Analysis

## Current Implementation

### How Matching Works
1. **Goal Event**: Kind 9041 has `event.id` (the actual Nostr event ID)
2. **Zap Receipt**: Kind 9735 has an `"e"` tag pointing to the event being zapped
3. **Matching**: `zapsByGoal[goal.eventId]` matches goal's event ID with zap's "e" tag value

**This logic is CORRECT per NIP-57 specification!**

## The Problem

The issue is in the **subscription strategy** in `src/pages/Index.tsx`:

```typescript
// Current approach - subscribes to ALL zaps without filtering
const zapFilter: NDKFilter = { kinds: [9735 as any], limit: 1000 };
zapSub = ndk.subscribe(zapFilter, { closeOnEose: false });
```

### Why This Fails

1. **No filtering**: Gets ALL kind 9735 events from relays (not just goal zaps)
2. **Limit of 1000**: Only retrieves first 1000 zaps total
3. **Wrong zaps**: Might get zaps for profiles, notes, etc., but miss goal zaps

### Real-World Example

If a relay has:
- 5,000 zaps total (kind 9735)
- 100 are for goals
- 4,900 are for notes/profiles

The current subscription will get the first 1,000 zaps chronologically, which might contain 0-20 goal zaps out of the 100 that exist.

## The Solution

### Approach 1: Filter by Event IDs (Recommended)
After goals are loaded, subscribe to zaps for those specific goals:

```typescript
// Wait for goals to load first
goalSub.on('eose', () => {
  // Get all goal event IDs
  const goalEventIds = Object.values(goals).map(g => g.eventId);
  
  // Subscribe to zaps ONLY for these goals
  const zapFilter: NDKFilter = { 
    kinds: [9735],
    "#e": goalEventIds  // Filter by event references
  };
  zapSub = ndk.subscribe(zapFilter);
});
```

### Approach 2: Increase Limit (Band-aid)
```typescript
const zapFilter: NDKFilter = { kinds: [9735 as any], limit: 5000 };
```
This might work but wastes bandwidth getting irrelevant zaps.

### Approach 3: Multiple Targeted Queries
Query zaps in batches for specific goal IDs:
```typescript
// Query 100 goals at a time
for (let i = 0; i < goalIds.length; i += 100) {
  const batch = goalIds.slice(i, i + 100);
  const filter: NDKFilter = { kinds: [9735], "#e": batch };
  ndk.subscribe(filter);
}
```

## Verification

To verify zaps are being received, check:
1. Console logs: `console.log('Received zap:', zap)` (line 151)
2. Redux state: Check `state.zaps.zapsByGoal` 
3. Network tab: Look for REQ/EVENT messages with kind 9735

## Code Locations

- **Parsing**: `src/lib/nostrHelpers.ts` lines 106-161 (parseZap9735)
- **Storage**: `src/stores/zapsSlice.ts` lines 18-40 (addZap)
- **Subscription**: `src/pages/Index.tsx` lines 144-158
- **Matching**: `src/stores/selectors.ts` lines 19-36 (selectEnrichedGoals)
