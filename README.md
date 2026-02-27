# Lumina

Lumina is a wallet-connected music social app built with Next.js.  
It combines Audius discovery with Tapestry onchain social actions (profiles, follows, likes, comments) and a local points leaderboard.

Try it here: https://lumina-opal-eta.vercel.app
Demo Video: https://youtu.be/pv0c7FJZ4ro


## Current Scope

- Audius integration for trending tracks, track search, artist discovery, artist/track detail pages
- Tapestry integration for profile creation/linking, follows, likes, comments
- Tapestry-backed artist conviction notes ("Back This Artist")
- Solana wallet connection via wallet adapter
- Local rewards system and leaderboard (Torque is intentionally not integrated)
- Audius-based "Undervalued Artist Radar" scoring

## Routes

- `/` Home: trending tracks, search, rewards banner
- `/discover` Artist discovery and search
- `/signals` Undervalued artist ranking + momentum signals
- `/feed` Onchain conviction-note feed
- `/artist/[id]` Artist profile, follow button, artist tracks
- `/track/[id]` Track detail, like button, comments
- `/profile` Wallet-linked Tapestry profile + rewards activity
- `/leaderboard` Local points leaderboard

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Solana wallet adapter
- Audius public API
- Tapestry API via local proxy route

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables in `.env.local`:

```bash
NEXT_PUBLIC_AUDIUS_API_KEY=...
NEXT_PUBLIC_TAPESTRY_API_KEY=...
```

3. Run development server:

```bash
pnpm dev
```

4. Open `http://localhost:3000`

## Architecture Notes

- `src/lib/audius.ts`: Audius service wrapper and response mapping
- `src/lib/tapestry.ts`: Tapestry service wrapper (follows, likes, comments, profiles)
- `src/app/api/tapestry/[...path]/route.ts`: server-side proxy for Tapestry requests
- `src/hooks/*`: wallet-aware hooks for profile, follow, like, rewards state

## Known Gaps

- Build output has been inconsistent in this environment (`next build` can hang without final output)
- Rewards and some social state rely on localStorage (not shared across devices)
- README and progress docs were recently updated, but test coverage is still minimal

## Standout Roadmap (Audius + Tapestry, No Torque)

1. Build a true social feed
- Show wallet user timeline from Tapestry actions: follows, likes, comments.
- Mix Audius metadata so feed items are playable and navigable.

2. Add collectible social context
- On track/artist pages, show recent likers/followers (profile chips).
- Convert counts into visible social proof, not just numbers.

3. Improve identity and profile reliability
- Add explicit profile-link/repair flow when local cache is missing.
- Avoid duplicate profile creation edge cases and expose profile status diagnostics.

4. Upgrade discovery with taste layers
- Personalized sections: "Because you followed", "Same genre as your recent likes".
- Use Audius search + trending + lightweight local preference model.

5. Tighten production quality
- Resolve lint blockers and add integration tests for follow/like/comment flows.
- Add centralized error surfaces, retries, and optimistic UI rollback.

## Immediate Next Sprint

1. Stabilize production build execution and runtime QA.
2. Expand feed beyond conviction notes to include follows/likes/comments events.
3. Add social proof UI on artist + track pages.
4. Add tests for profile recovery and follow toggling.
