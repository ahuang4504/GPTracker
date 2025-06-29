# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GPTracker is a Chrome extension that tracks ChatGPT usage patterns. It combines a React popup interface with Chrome extension APIs to monitor visits to chatgpt.com and sync data with Supabase for user authentication and data persistence.

## Common Commands

- `bun run dev` - Start development server with Vite
- `bun run build` - Build the project (TypeScript compilation + Vite build)
- `bun run lint` - Run ESLint on the codebase
- `bun run preview` - Preview the built application

## Architecture

### Extension Structure
- **Popup Interface**: React app (`src/App.tsx`) served as the extension popup via `index.html`
- **Background Script**: Service worker (`src/background.ts`) handles tab monitoring and visit counting
- **Content Script**: Minimal script (`src/content.ts`) that runs on chatgpt.com pages
- **Build Output**: Vite generates separate bundles for main app, background, and content scripts

### Key Components
- **Authentication Flow**: Uses Supabase Auth with Google OAuth through `AuthPanel` and `Dashboard` components
- **Visit Tracking**: Background script monitors tab activations/updates for chatgpt.com URLs
- **Data Sync**: Periodic push/pull of visit data to/from Supabase with local storage fallback
- **Time Management**: Daily count resets and timezone handling via `timeUtils.ts`

### Data Flow
1. Background script detects ChatGPT visits and increments local counter
2. Visit data syncs periodically to Supabase when user is authenticated
3. Popup displays current visit counts from local storage or Supabase
4. Daily reset logic prevents double-counting across date boundaries

### Build Configuration
- Uses Vite with custom rollup config for multi-entry builds
- Generates `background.js`, `content.js`, and main popup bundle
- TypeScript with path aliases (`@/` -> `src/`)
- Chrome extension manifest v3 with required permissions

## Environment Setup

Requires environment variables in development:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Key Files to Understand

- `src/background.ts` - Core extension logic for visit tracking
- `src/utils/visit_logic.ts` - Supabase sync operations
- `src/utils/timeUtils.ts` - Date/time handling and daily resets
- `public/manifest.json` - Chrome extension configuration
- `vite.config.ts` - Build configuration for multi-entry extension