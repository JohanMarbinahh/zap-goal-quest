# ZapGoal Architecture Documentation

## Overview

ZapGoal is a Nostr-native fundraising platform built as a single-page application (SPA) using React and TypeScript. It follows a unidirectional data flow pattern using Redux Toolkit for state management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │              React Application                      │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│ │
│  │  │   Pages      │  │  Components  │  │   UI     ││ │
│  │  │  (Routes)    │  │   (Business) │  │ (shadcn) ││ │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘│ │
│  │         │                 │                │       │ │
│  │         └─────────┬───────┴────────────────┘       │ │
│  │                   │                                 │ │
│  │         ┌─────────▼─────────┐                      │ │
│  │         │   Redux Store     │                      │ │
│  │         │  (State Mgmt)     │                      │ │
│  │         └─────────┬─────────┘                      │ │
│  │                   │                                 │ │
│  │         ┌─────────▼─────────┐                      │ │
│  │         │  NDK (Nostr Kit)  │                      │ │
│  │         └─────────┬─────────┘                      │ │
│  └───────────────────┼──────────────────────────────┘ │
│                      │                                  │
└──────────────────────┼──────────────────────────────────┘
                       │
                       │ WebSocket (wss://)
                       │
        ┌──────────────▼──────────────┐
        │      Nostr Relay Pool       │
        │                             │
        │  ┌──────┐  ┌──────┐        │
        │  │Relay1│  │Relay2│  ...   │
        │  └──────┘  └──────┘        │
        └─────────────────────────────┘
```

## Core Layers

### 1. Presentation Layer (React Components)

#### Pages (`src/pages/`)
- **Index.tsx** - Main dashboard showing all goals
- **GoalDetail.tsx** - Detailed view of a single goal with zaps
- **MyGoals.tsx** - User's created goals
- **Settings.tsx** - App configuration

#### Components (`src/components/`)
- **Header.tsx** - Navigation and auth status
- **GoalCard.tsx** - Goal preview card
- **CreateGoalDialog.tsx** - Goal creation form
- **RelayStatus.tsx** - Relay connection indicator
- **ZapTimeline.tsx** - Chart of zaps over time

### 2. State Management Layer (Redux)

#### Store Structure
```typescript
{
  auth: {
    pubkey: string | null,
    npub: string | null,
    isNip07: boolean,
    ephemeralKey: string | null
  },
  relays: {
    relays: string[],
    relayStatuses: RelayStatus[]
  },
  profiles: {
    profiles: Record<pubkey, Profile>
  },
  goals: {
    goals: Record<goalId, Goal9041>
  },
  zaps: {
    zapsByGoal: Record<eventId, Zap9735[]>,
    zapsByPubkey: Record<pubkey, Zap9735[]>
  }
}
```

#### Slices
- **authSlice** - Authentication state (persisted)
- **relaysSlice** - Relay management (persisted)
- **profilesSlice** - Profile caching (memory)
- **goalsSlice** - Goals storage (memory)
- **zapsSlice** - Zaps tracking (memory)

### 3. Integration Layer (NDK)

#### NDK Manager (`src/lib/ndk.ts`)
- Singleton NDK instance management
- Relay pool connection handling
- Event publishing
- Signer setup (NIP-07 or ephemeral)

#### Nostr Helpers (`src/lib/nostrHelpers.ts`)
- Event parsing functions
- Data transformation
- Formatting utilities

## Data Flow

### 1. Application Initialization

```
App Mount
  ↓
Initialize NDK
  ↓
Connect to Relays
  ↓
Setup Authentication
  ↓
Subscribe to Events
  ↓
Render UI
```

### 2. Reading Data (Subscriptions)

```
User Opens Page
  ↓
Component Mounts
  ↓
NDK.subscribe({kinds, filters})
  ↓
Relay Sends Events
  ↓
Parse Event Data
  ↓
Dispatch to Redux
  ↓
Component Re-renders
```

### 3. Writing Data (Publishing)

```
User Submits Form
  ↓
Create NDK Event
  ↓
Sign Event (NIP-07 or Key)
  ↓
Publish to Relays
  ↓
Wait for Confirmation
  ↓
Update Local State
  ↓
Show Success Toast
```

## Authentication Flow

### NIP-07 (Browser Extension)

```
Check window.nostr
  ↓
Create NDKNip07Signer
  ↓
Get User Pubkey
  ↓
Store in Redux (isNip07: true)
  ↓
Ready to Sign Events
```

### Ephemeral Key (Fallback)

```
No window.nostr
  ↓
Check localStorage for Key
  ↓
Generate New Key if None
  ↓
Create NDKPrivateKeySigner
  ↓
Store in Redux (isNip07: false)
  ↓
Ready to Sign Events
```

## Event Handling

### Goal Creation (Kind 9041)

```typescript
// Event structure
{
  kind: 9041,
  content: "",
  tags: [
    ["d", "<unique-goal-id>"],      // Replaceable event ID
    ["title", "<goal-name>"],       // Goal title
    ["goal", "sats", "<amount>"],   // Target amount
    ["amount", "<amount>"],         // Alternative format
    ["unit", "sat"],                // Currency unit
    ["image", "<url>"],             // Optional image
    ["status", "active"]            // active|paused|completed
  ]
}
```

### Zap Receipt (Kind 9735)

```typescript
// Event structure
{
  kind: 9735,
  content: "",
  tags: [
    ["p", "<recipient-pubkey>"],    // Who received
    ["e", "<goal-event-id>"],       // Optional: linked goal
    ["bolt11", "<invoice>"],        // Payment invoice
    ["description", "<json>"]       // Contains amount, memo
  ]
}
```

## Performance Considerations

### 1. Event Caching
- Profiles cached in memory (avoid duplicate fetches)
- Goals stored in normalized Redux structure
- Zaps indexed by both goal and pubkey

### 2. Subscription Management
- Subscriptions created on component mount
- Cleaned up on unmount (preventing memory leaks)
- Filters optimized for relevant data only

### 3. Rendering Optimization
- React.memo for expensive components
- Redux selectors for derived data
- Virtualized lists for large zap feeds (future)

## Security Considerations

### 1. Key Management
- NIP-07: Keys never leave extension
- Ephemeral: Keys stored in localStorage only
- No server-side key storage

### 2. Event Validation
- Parse and validate all incoming events
- Type checking with TypeScript
- Sanitize user inputs

### 3. Relay Trust
- Connect to known, trusted relays
- No sensitive data in events (all public)
- User can configure relay list

## Scalability

### Current Architecture
- Client-side only (no backend)
- Scales with browser resources
- Relay bandwidth dependent

### Future Enhancements
- Event pagination
- Virtual scrolling
- IndexedDB for larger datasets
- Service worker for offline support

## Testing Strategy

### Unit Tests
- Redux reducers
- Event parsing functions
- Utility functions

### Integration Tests
- Component + Redux interactions
- NDK event handling
- Form submissions

### E2E Tests
- Full user flows
- Multi-relay scenarios
- Authentication paths

## Deployment

### Build Process
```
Source Files
  ↓
TypeScript Compilation
  ↓
Vite Bundle
  ↓
Tree Shaking
  ↓
Code Splitting
  ↓
Minification
  ↓
dist/ folder
```

### Production Artifacts
- `index.html` - Entry point
- `assets/*.js` - Code bundles
- `assets/*.css` - Styles
- `robots.txt` - SEO

## Monitoring & Debugging

### Development
- React DevTools (component tree)
- Redux DevTools (state inspection)
- Browser console (NDK logs)
- Network tab (WebSocket traffic)

### Production
- Error boundaries for graceful failures
- Console logging (levels)
- User-facing error messages
- Relay connection status indicator

## Future Architecture Improvements

1. **Offline Support**
   - Service worker caching
   - IndexedDB for events
   - Queue outgoing events

2. **Performance**
   - Virtual scrolling
   - Event pagination
   - Web Workers for parsing

3. **Features**
   - NIP-05 verification
   - NIP-46 remote signing
   - DM support (NIP-04)
   - File uploads to Blossom

4. **Testing**
   - Comprehensive test coverage
   - E2E test automation
   - Performance benchmarks
