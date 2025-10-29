# Developer Guide - ZapGoal

## 🎯 Project Overview

ZapGoal is a Nostr-based fundraising platform where users can:
- Create fundraising goals
- Receive Bitcoin zaps (payments)
- Post updates on their goals
- Engage with reactions and comments

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
├─────────────────────────────────────────────────────────┤
│  Pages/        Components/       Hooks/                  │
│  - Index       - GoalCard        - useGoalsSubscription  │
│  - GoalDetail  - GoalComments    - useGoalUpdates       │
│  - MyGoals     - GoalUpdates     - useGoalReactions     │
│  - Login       - CreateGoalDialog - useGoalComments     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Redux Store (State)                     │
├─────────────────────────────────────────────────────────┤
│  Slices:                                                 │
│  - auth        → User authentication                     │
│  - goals       → All fundraising goals                   │
│  - zaps        → Zaps organized by goal                  │
│  - reactions   → Likes/dislikes/emoji reactions         │
│  - comments    → Comments on goals                       │
│  - updates     → Goal progress updates                   │
│  - profiles    → User profile data                       │
│  - relays      → Nostr relay connections                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NDK (Nostr Development Kit)                 │
├─────────────────────────────────────────────────────────┤
│  - Manages connections to Nostr relays                   │
│  - Subscribes to events (real-time data)                │
│  - Publishes events to the network                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Nostr Relays                           │
│              (wss://relay.damus.io, etc.)               │
└─────────────────────────────────────────────────────────┘
```

## 📁 Key Files to Understand

### 1. State Management (`src/stores/`)
- **`store.ts`** - Configures Redux store with all slices
- **`selectors.ts`** - Memoized selectors that compute derived data
- **`[name]Slice.ts`** - Individual state slices (goals, zaps, etc.)

### 2. Nostr Integration (`src/lib/`)
- **`ndk.ts`** - Initializes NDK, handles authentication, publishes events
- **`nostrHelpers.ts`** - Parses Nostr events into typed objects

### 3. Data Fetching (`src/hooks/`)
- **`useGoalsSubscription.ts`** - Main hook that subscribes to all goals, zaps, reactions
- **`useGoalUpdates.ts`** - Fetches updates for a specific goal
- **`useGoalComments.ts`** - Fetches comments for a specific goal
- **`useGoalReactions.ts`** - Fetches reactions for a specific goal

### 4. UI Components (`src/components/`)
- **`GoalCard.tsx`** - Displays goal summary (title, progress, zaps)
- **`GoalsList.tsx`** - List of all goals with filtering
- **`GoalDetail.tsx`** - Full goal page with updates/comments
- **`CreateGoalDialog.tsx`** - Form to create new fundraising goals

## 🔄 Data Flow Example: Viewing Goals

```
1. User visits homepage (Index.tsx)
   └─> useGoalsSubscription() hook runs
       │
2. Hook subscribes to Nostr events:
   └─> NDK.subscribe({ kinds: [9041] }) // Goals
   └─> NDK.subscribe({ kinds: [9735] }) // Zaps
   └─> NDK.subscribe({ kinds: [7] })    // Reactions
       │
3. Events received from relays:
   └─> parseGoal9041(event) → Goal object
   └─> parseZap9735(event) → Zap object
   └─> parseReaction7(event) → Reaction object
       │
4. Parsed objects stored in Redux:
   └─> dispatch(addGoal(goal))
   └─> dispatch(addZap(zap))
   └─> dispatch(addReaction(reaction))
       │
5. Components read from Redux:
   └─> useAppSelector(state => state.goals.goals)
   └─> selectEnrichedGoals (combines goals + zaps + reactions)
       │
6. UI renders with real-time updates
```

## 🎨 UI Component Pattern

Most components follow this pattern:

```typescript
// 1. Import dependencies
import { useAppSelector } from '@/stores/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// 2. Define props interface
interface MyComponentProps {
  goalId: string;
}

// 3. Component function
export function MyComponent({ goalId }: MyComponentProps) {
  // 4. Get data from Redux
  const goal = useAppSelector(state => state.goals.goals[goalId]);
  
  // 5. Local state if needed
  const [isOpen, setIsOpen] = useState(false);
  
  // 6. Event handlers
  const handleClick = () => {
    // Do something
  };
  
  // 7. Render
  return (
    <Card>
      <CardContent>
        {goal.title}
      </CardContent>
    </Card>
  );
}
```

## 🚀 How to Add a New Feature

### Example: Adding Comments (Step-by-step)

#### Step 1: Create the UI Component
```typescript
// src/components/CreateCommentForm.tsx
export function CreateCommentForm({ goalEventId }: Props) {
  const [content, setContent] = useState('');
  
  const handleSubmit = async () => {
    // Create Nostr event
    // Publish it
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Step 2: Create Nostr Event
```typescript
const ndk = getNDK();
const event = new NDKEvent(ndk);
event.kind = 1; // Kind 1 = text note (comment)
event.content = content;
event.tags = [
  ['e', goalEventId, '', 'root'], // Links to goal
  ['p', goalAuthorPubkey],        // Tags goal author
];
await event.publish();
```

#### Step 3: Subscribe to Events
```typescript
// Hook already exists: useGoalComments.ts
// It subscribes to kind 1 events that reference the goal
```

#### Step 4: Display in UI
```typescript
// src/components/GoalComments.tsx
const comments = useGoalComments(goalEventId);
return (
  <>
    <CreateCommentForm goalEventId={goalEventId} />
    {comments.map(comment => (
      <CommentCard key={comment.eventId} comment={comment} />
    ))}
  </>
);
```

## 🔑 Key Nostr Concepts

### Event Kinds
- **Kind 0**: User profile metadata
- **Kind 1**: Text note (used for comments/updates)
- **Kind 7**: Reaction (like/dislike/emoji)
- **Kind 9041**: Fundraising goal (custom)
- **Kind 9735**: Zap receipt (Bitcoin payment)

### Event Tags
Tags create relationships between events:
```javascript
[
  ['e', '<event-id>', '<relay-url>', '<marker>'], // References another event
  ['p', '<pubkey>'],                               // Tags a user
  ['d', '<identifier>'],                           // Unique identifier
  ['amount', '<sats>'],                            // Amount in sats
]
```

### Publishing Events
```typescript
const event = new NDKEvent(ndk);
event.kind = 1;
event.content = "Hello Nostr!";
event.tags = [['e', goalEventId]];
await event.publish();
```

### Subscribing to Events
```typescript
const subscription = ndk.subscribe({
  kinds: [1],           // Text notes
  '#e': [goalEventId],  // That reference this goal
});

subscription.on('event', (event) => {
  // Handle new event
});
```

## 🛠️ Development Workflow

### Running the App
```bash
npm install
npm run dev
```

### Understanding Subscriptions
Open browser console and look for:
- `🎯 Loaded X goals` - Goals fetched
- `⚡ Loaded X zaps for Y goals` - Zaps aggregated
- `👍 Loaded X reactions` - Reactions counted

### Testing Event Publishing
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click a relay connection
4. Watch events being sent/received in real-time

### Common Debugging
- **No goals showing?** → Check relay connections in Settings
- **Zaps not counting?** → Check console for zap loading logs
- **Can't publish?** → Make sure you're logged in (check Redux auth state)

## 📚 Learning Resources

### Understanding the Code
1. Start with `src/pages/Index.tsx` - Main page
2. Follow data flow: `useGoalsSubscription.ts` → Redux → Components
3. Read `NOSTR_PATTERNS.md` for Nostr event examples

### Nostr Protocol
- [Nostr NIPs](https://github.com/nostr-protocol/nips) - Protocol specs
- [NDK Documentation](https://github.com/nostr-dev-kit/ndk) - Library docs
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) - Basic protocol

### Key Libraries
- **React** - UI framework
- **Redux Toolkit** - State management
- **NDK** - Nostr Development Kit
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling

## 🎯 Next Steps for You

1. **Read this guide** - Understand the architecture
2. **Read `NOSTR_PATTERNS.md`** - Understand Nostr events
3. **Explore `src/hooks/useGoalsSubscription.ts`** - See how data flows
4. **Run the app** - Watch console logs
5. **Implement comments feature** - Follow the plan from previous message
6. **Test your changes** - Publish a comment and see it appear

## 💡 Pro Tips

- **Redux DevTools** - Install browser extension to inspect state
- **Console logs** - The codebase has helpful logs (search for `console.log`)
- **Mock data** - Some hooks include mock data for testing
- **Component reuse** - Use existing UI components from `src/components/ui/`
- **TypeScript** - Let types guide you (hover over variables to see types)

## 🐛 Common Issues

### "NDK not initialized"
- Make sure `initNDK()` is called in `App.tsx`
- Check that you're not calling `getNDK()` before initialization

### "Cannot read property of undefined"
- Check if data exists before accessing: `goal?.title`
- Use optional chaining and fallbacks

### Events not appearing
- Check relay connections in Settings page
- Verify event kind and tags are correct
- Check console for subscription errors

---

**Remember:** You don't need to understand everything at once. Start with one feature, follow the data flow, and build your understanding incrementally!
