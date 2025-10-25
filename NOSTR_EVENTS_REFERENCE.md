# Nostr Events Reference

This document provides example data for all Nostr event types used in this application and maps their fields to UI components.

---

## 1. Profile Event (Kind 0)

**Purpose:** Contains user profile metadata like name, picture, bio, and Lightning address.

### Example Event Data:
```json
{
  "kind": 0,
  "pubkey": "a064f478...4c83",
  "created_at": 1698765432,
  "content": "{\"name\":\"alice\",\"display_name\":\"Alice Johnson\",\"picture\":\"https://example.com/alice.jpg\",\"about\":\"Bitcoin developer and privacy advocate\",\"lud16\":\"alice@getalby.com\",\"nip05\":\"alice@example.com\",\"website\":\"https://alice.example.com\",\"banner\":\"https://example.com/banner.jpg\"}",
  "tags": []
}
```

### Parsed Profile Type:
```typescript
interface Profile {
  pubkey: string;                    // User's public key
  name?: string;                     // Username (e.g., "alice")
  displayName?: string;              // Display name (e.g., "Alice Johnson")
  display_name?: string;             // Alternative field name
  picture?: string;                  // Profile picture URL
  lud16?: string;                    // Lightning address (e.g., "alice@getalby.com")
  about?: string;                    // Bio/description
  banner?: string;                   // Banner image URL
  nip05?: string;                    // Nostr address verification
  website?: string;                  // Personal website
  location?: string;                 // Location
  twitter?: string;                  // Twitter handle
  github?: string;                   // GitHub username
}
```

### UI Component Mapping:
| Field | Component | Location | Usage |
|-------|-----------|----------|-------|
| `picture` | `<Avatar>` / `<AvatarImage>` | All cards, lists | Profile picture display |
| `displayName` / `name` | `<h3>`, `<span>` | Header, cards | Primary display name |
| `name` | `<span className="text-muted-foreground">` | Profile cards | Username @handle |
| `about` | `<p>` in `<CardContent>` | GoalDetail, Profile pages | Bio/description text |
| `lud16` | `<span>` with Zap icon | GoalDetail, funding UI | Lightning payment link |
| `nip05` | `<span>` with @ icon | Profile cards | Verification badge |
| `website` | `<a>` with Globe icon | Profile cards | Clickable external link |

---

## 2. Goal Event (Kind 9041)

**Purpose:** Represents a fundraising goal with target amount, description, and status.

### Example Event Data:
```json
{
  "kind": 9041,
  "id": "654f73fef8e89024...",
  "pubkey": "a064f478...4c83",
  "created_at": 1698765432,
  "content": "{\"title\":\"Apfelyse\",\"summary\":\"Building an open-source Bitcoin analytics platform\"}",
  "tags": [
    ["d", "apfelyse-project-2024"],              // Goal ID (d tag)
    ["amount", "21000000"],                       // Target in millisats
    ["closed_at", "1735689600"],                  // Optional close timestamp
    ["image", "https://example.com/goal.jpg"],    // Goal image
    ["status", "active"]                          // Status: active/closed
  ]
}
```

### Parsed Goal9041 Type:
```typescript
interface Goal9041 {
  eventId: string;          // Event ID (e.g., "654f73fe...")
  goalId: string;           // d tag value (e.g., "apfelyse-project-2024")
  authorPubkey: string;     // Creator's public key
  title?: string;           // Goal title from content or tags
  name?: string;            // Alternative title field
  targetSats: number;       // Target amount in satoshis (e.g., 21000)
  status?: string;          // "active" or "closed"
  createdAt: number;        // Unix timestamp
  imageUrl?: string;        // Goal image URL
  summary?: string;         // Description text
}
```

### UI Component Mapping:
| Field | Component | Location | Usage |
|-------|-----------|----------|-------|
| `title` / `name` | `<h1 className="text-5xl">` | GoalDetail page header | Main goal title |
| `title` / `name` | `<CardTitle>` | GoalCard | Card title |
| `imageUrl` | `<img>` in aspect-video div | GoalDetail, GoalCard | Goal hero image |
| `summary` | `<p className="text-muted-foreground">` | GoalDetail "About" section | Full description |
| `targetSats` | `<span>` with formatSats() | Progress cards, detail views | Target amount display |
| `status` | `<Badge>` | GoalDetail header, cards | Status indicator |
| `createdAt` | `<span>` with formatRelativeTime() | Goal metadata | "Created 2 days ago" |
| `goalId` | `<p className="font-mono">` | Goal Details card | Unique identifier |

---

## 3. Zap Event (Kind 9735)

**Purpose:** Represents a Lightning payment (zap) to a goal or user.

### Example Event Data:
```json
{
  "kind": 9735,
  "id": "abc123...",
  "pubkey": "zapper-pubkey...",
  "created_at": 1698765432,
  "content": "",
  "tags": [
    ["p", "a064f478...4c83"],                    // Recipient pubkey
    ["e", "654f73fef8e89024..."],                // Target event (goal)
    ["bolt11", "lnbc210u1p..."],                 // Lightning invoice
    ["description", "{\"content\":\"Great work! ⚡\",\"amount\":21000000}"]  // Zap metadata
  ]
}
```

### Parsed Zap9735 Type:
```typescript
interface Zap9735 {
  eventId: string;              // Zap event ID
  createdAt: number;            // Unix timestamp
  amountMsat: number;           // Amount in millisatoshis (e.g., 21000000 = 21 sats)
  recipientPubkey?: string;     // Recipient's pubkey (from #p tag)
  targetEventId?: string;       // Target goal event ID (from #e tag)
  zapperPubkey?: string;        // Sender's pubkey
  memo?: string;                // Message with the zap
}
```

### UI Component Mapping:
| Field | Component | Location | Usage |
|-------|-----------|----------|-------|
| `amountMsat` / 1000 | `<span className="font-bold">` with formatSats() | Zap list items | "21 sats" display |
| `zapperPubkey` | `<Avatar>` + name lookup | Recent Zaps list | Zapper profile |
| `memo` | `<span className="text-sm">` | Zap list items | Message text |
| `createdAt` | `<span className="text-xs">` with formatRelativeTime() | Zap list items | "5m ago" timestamp |
| All zaps | Aggregated sum | Progress cards | Total raised amount |
| Grouped by zapper | `<div>` in Top Supporters | Supporters leaderboard | Ranked supporter list |

---

## 4. Reaction Event (Kind 7)

**Purpose:** Represents a like/reaction to a goal or zap.

### Example Event Data:
```json
{
  "kind": 7,
  "id": "reaction123...",
  "pubkey": "reactor-pubkey...",
  "created_at": 1698765432,
  "content": "👍",
  "tags": [
    ["e", "654f73fef8e89024..."],               // Target event ID
    ["p", "a064f478...4c83"]                    // Target author pubkey
  ]
}
```

### Parsed Reaction7 Type:
```typescript
interface Reaction7 {
  eventId: string;          // Reaction event ID
  createdAt: number;        // Unix timestamp
  targetEventId: string;    // ID of event being reacted to
  reactorPubkey: string;    // Person who reacted
  content: string;          // Reaction emoji (e.g., "👍", "+", "❤️")
}
```

### UI Component Mapping:
| Field | Component | Location | Usage |
|-------|-----------|----------|-------|
| `content` | `<Button>` with ThumbsUp icon | Zap list items | Like button (currently static) |
| Count | `<span>` | Goal cards (if implemented) | Reaction count display |

---

## UI Component Hierarchy

### GoalCard Component
```
<Card>
  ├─ <Avatar> ← profile.picture
  ├─ <CardTitle> ← goal.title / goal.name
  ├─ <p> (summary) ← goal.summary (truncated)
  ├─ <Progress> ← calculated % (raised / targetSats)
  ├─ <span> (raised) ← sum of zaps.amountMsat
  ├─ <span> (target) ← goal.targetSats
  └─ <Button> (Fund Goal) ← opens lightning:profile.lud16
```

### GoalDetail Page
```
<main>
  ├─ <h1> ← goal.title (5xl, prominent)
  ├─ <Avatar> + creator info ← profile.*
  ├─ <img> (hero) ← goal.imageUrl
  ├─ <Card> (About) ← goal.summary
  ├─ <Card> (Goal Info) ← goal.targetSats, goalId, status
  ├─ <Card> (Creator) ← profile.about, lud16
  ├─ <Card> (Progress) ← raised amount, progress %, zap count
  ├─ <Button> (Fund) ← lightning:profile.lud16
  ├─ <Card> (Recent Zaps)
  │   └─ Zap items ← zap.amountMsat, memo, createdAt, zapperPubkey
  └─ <Card> (Top Supporters)
      └─ Supporter ranks ← aggregated zap amounts per zapperPubkey
```

---

## Data Flow Summary

1. **Profile (Kind 0)** → `profilesSlice` → Used to enrich all UI with user names/avatars
2. **Goal (Kind 9041)** → `goalsSlice` → Primary entity for goal listings and detail pages
3. **Zap (Kind 9735)** → `zapsSlice` → Grouped by `targetEventId` to calculate raised amounts
4. **Reaction (Kind 7)** → Currently parsed but not actively used in UI

### Key Relationships:
- `Goal.authorPubkey` → `Profile.pubkey` (goal creator)
- `Zap.targetEventId` → `Goal.eventId` (zap destination)
- `Zap.zapperPubkey` → `Profile.pubkey` (zap sender)
- `Zap.recipientPubkey` → `Profile.pubkey` (zap recipient, usually goal author)

---

## Helper Functions

### formatSats(sats: number): string
Formats satoshi amounts with K/M suffixes:
- `formatSats(1000)` → "1.0K"
- `formatSats(21000)` → "21.0K"
- `formatSats(1500000)` → "1.5M"

### formatRelativeTime(timestamp: number): string
Converts Unix timestamps to relative time strings:
- `formatRelativeTime(now - 300)` → "5m ago"
- `formatRelativeTime(now - 7200)` → "2h ago"
- `formatRelativeTime(now - 86400)` → "1d ago"

### shortNpub(pubkey: string): string
Converts hex pubkeys to short npub format:
- `shortNpub("a064f478...")` → "a064f478...4c83"
