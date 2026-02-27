# Lumina

Lumina is a music social app built for the Audius + Tapestry cluster track.

It combines Audius discovery with Tapestry social actions so fans can discover artists early, back them with conviction notes, and build supporter reputation.

Live Demo: https://lumina-opal-eta.vercel.app  
Video: https://youtu.be/pv0c7FJZ4ro

## Core Features

- Audius-powered music discovery: trending, search, artist and track pages
- Personalized discovery rails: Because You Followed, Similar To Your Likes, Rising In Your Graph
- Tapestry social actions: profile linking, follow, like, comment
- Conviction notes: "Back This Artist" thesis posts
- Social proof modules: recent followers, recent backers, shared fans
- Feed + reputation: activity stream, supporter score, badges, leaderboard

## App Routes

- `/` Home
- `/discover` Discovery + personalization
- `/signals` Undervalued artist ranking
- `/feed` Social activity feed
- `/artist/[id]` Artist page with backing + social proof
- `/track/[id]` Track page with likes/comments
- `/profile` Wallet-linked profile + reputation
- `/leaderboard` Points + supporter ranking
- `/playlist-140` Hidden showcase route for Audius playlist UI

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Solana wallet adapter
- Audius API
- Tapestry API (proxied via `/api/tapestry/[...path]`)

## Local Setup

```bash
pnpm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_AUDIUS_API_KEY=...
NEXT_PUBLIC_TAPESTRY_API_KEY=...
```

Run:

```bash
pnpm dev
```

Open `http://localhost:3000`.
