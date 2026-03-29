# Bennett — Personal AI Assistant

A progressive web app (PWA) that serves as your personal AI assistant, built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

- **AI Chat** — Conversational interface with markdown rendering, powered by OpenAI or Anthropic
- **Multi-provider routing** — Switch between OpenAI (GPT-4) and Anthropic (Claude) from Settings
- **Firebase auth** — Sign in with Google or email/password
- **Connections** — Connect services like Gmail, Google Calendar, Drive, Philips Hue, Spotify, Weather and more via MCP-style integrations
- **PWA ready** — Installable on mobile and desktop
- **Responsive** — Mobile bottom nav + desktop sidebar layout

## Tech Stack

- Vite + React + TypeScript
- Firebase (Auth + Firestore)
- Zustand (state management)
- Tailwind CSS v3
- react-markdown + remark-gfm
- lucide-react icons

## Getting Started

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

3. **Run dev server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_OPENAI_API_KEY` | Optional local dev fallback for OpenAI |
| `VITE_ANTHROPIC_API_KEY` | Optional local dev fallback for Anthropic |

For GitHub Pages deployments, do not publish model provider secrets through Vite env vars. Enter provider API keys in Settings after loading the app; they are stored only in the current browser.

## GitHub Pages Deploy

This repo includes a GitHub Actions workflow that builds and deploys the app to GitHub Pages.

Required GitHub Actions secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

After pushing to `main`, enable GitHub Pages in the repository settings and choose `GitHub Actions` as the source.

Production builds use a GitHub Pages-safe base path and hash routing, so deep links work without server rewrites.

## Firebase Rules Deploy

This repo is configured to deploy Firestore rules with the Firebase CLI.

Commands:

- `npm run firebase:login`
- `npm run firebase:use <your-project-id>`
- `npm run firebase:deploy:rules`

The Firebase CLI will create `.firebaserc` after you select your project.

## Project Structure

```
src/
├── components/
│   ├── chat/         # ChatBubble, MessageInput, TypingIndicator
│   ├── layout/       # Navigation, ProtectedRoute
│   └── ui/           # Button, Card, Input, StatusDot, ConnectionCard
├── core/             # AIRouter, MCPBridge, Orchestrator
├── hooks/            # useAuth, useChat
├── lib/              # Firebase config, utilities
├── mcp/              # MCP kit registry
├── pages/            # Auth, Home, Connections, Settings
├── providers/        # OpenAI, Anthropic provider implementations
└── stores/           # Zustand stores (auth, chat, connections)
```
