# ZapGoal - Nostr Fundraising Client

A production-ready Nostr client for creating and tracking fundraising goals (Zap Goals) with real-time Lightning zap receipts and analytics.

## Features

- 🎯 **Create Fundraising Goals** - Publish kind 9041 events to Nostr
- ⚡ **Real-time Zap Tracking** - Monitor Lightning zaps (kind 9735) as they happen
- 📊 **Analytics Dashboard** - View progress, top supporters, and zap timelines
- 🔐 **Flexible Authentication** - NIP-07 browser extension support with ephemeral key fallback
- 🌐 **Multi-Relay Support** - Connect to multiple Nostr relays simultaneously
- 🎨 **Modern UI** - Built with React, TypeScript, and Tailwind CSS

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Redux Toolkit with Redux Persist
- **Nostr Integration**: NDK (Nostr Dev Kit)
- **Lightning**: NIP-57 Zap support

## Prerequisites

- Node.js 18+ and npm
- A Nostr browser extension (optional but recommended):
  - [Alby](https://getalby.com/)
  - [nos2x](https://github.com/fiatjaf/nos2x)

## Getting Started

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd zapgoal

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Main navigation
│   ├── GoalCard.tsx    # Goal display card
│   ├── CreateGoalDialog.tsx
│   ├── RelayStatus.tsx
│   └── ZapTimeline.tsx
├── pages/              # Page components
│   ├── Index.tsx       # Dashboard
│   ├── GoalDetail.tsx  # Individual goal view
│   ├── MyGoals.tsx     # User's goals
│   └── Settings.tsx    # App settings
├── stores/             # Redux slices
│   ├── authSlice.ts    # Authentication state
│   ├── goalsSlice.ts   # Goals state
│   ├── profilesSlice.ts # Profile cache
│   ├── relaysSlice.ts  # Relay management
│   ├── zapsSlice.ts    # Zaps tracking
│   ├── store.ts        # Redux store config
│   └── hooks.ts        # Typed Redux hooks
├── lib/                # Utilities
│   ├── ndk.ts          # NDK initialization
│   ├── nostrHelpers.ts # Nostr event parsers
│   └── utils.ts        # General utilities
└── types/              # TypeScript definitions
    └── nostr.ts        # Nostr type definitions
```

## Nostr Event Kinds

ZapGoal works with the following Nostr event kinds:

- **9041** - Zap Goal (fundraising campaigns)
- **9735** - Zap Receipt (Lightning payments)
- **0** - Profile Metadata
- **7** - Reactions (for thanking zaps)
- **3** - Follow Lists (optional filtering)

## Configuration

### Relays

Default relays are configured in `src/stores/relaysSlice.ts`:
- wss://relay.damus.io
- wss://nostr.wine
- wss://relay.primal.net
- wss://nos.lol

You can add/remove relays in the Settings page.

### State Persistence

Redux state is persisted to localStorage for:
- Authentication (keys and identity)
- Relay configuration

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Functional React components with hooks
- Redux Toolkit for state management
- Tailwind CSS for styling
- ESLint for code quality

## Deployment

### Build

```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

### Hosting Options

- **Static Hosting**: Netlify, Vercel, Cloudflare Pages, GitHub Pages
- **Traditional Hosting**: Any web server (Apache, Nginx, etc.)

### Environment Variables

No environment variables required - all configuration is done through the UI.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project however you'd like.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Built with [NDK](https://github.com/nostr-dev-kit/ndk)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Nostr protocol specifications from [NIPs](https://github.com/nostr-protocol/nips)
