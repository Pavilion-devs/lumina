# Cluster 2 — Music Social: Build Plan

**Bounties:** Audius (Music) + Tapestry (Onchain Social)  
**Status:** Prototype live, entering differentiation + hardening phase

---

## Product Concept

**Lumina** is a social music app where:
1. Fans discover artists and tracks via Audius.
2. Social actions (profiles, follows, likes, comments) are persisted via Tapestry.
3. Users earn in-app loyalty points for engagement (no Torque dependency).

---

## Current Implementation Status

### Completed

- [x] Next.js 16 app scaffold with TypeScript + Tailwind
- [x] Solana wallet connection flow
- [x] Audius service layer for trending/search/user/track data
- [x] Tapestry service layer for profile, follow, like, comment flows
- [x] Local rewards points + leaderboard
- [x] Core routes: Home, Discover, Artist, Track, Profile, Leaderboard

### Open Technical Gaps

- [x] Resolve lint blockers and keep `pnpm lint` green
- [ ] Add robust user-facing error states for failed actions
- [ ] Reduce localStorage-only dependency for social state continuity
- [ ] Add integration tests for profile/follow/like/comment flows

---

## Architecture

```text
Frontend (Next.js)
├── Home / Discover / Artist / Track / Profile / Leaderboard
├── Audius Integration Layer (music catalog + discovery)
├── Tapestry Integration Layer (onchain social graph)
└── Wallet Layer (Solana wallet adapter)
```

### Data Flow

```text
User Action -> Wallet Context -> Tapestry social write/read
                                -> Audius metadata/read model
                                -> Local rewards points update
```

---

## Differentiation Roadmap (What Makes It Stand Out)

### Competitive Inspiration (Translated to Lumina)

- MusicValue-style lesson: fans need a clear upside loop.  
  Lumina translation: build conviction and reputation loops around early support.
- Preset-style lesson: utility wins when output is concrete.  
  Lumina translation: generate concrete signal surfaces users can act on.
- Alphadius-style lesson: opinionated ranking drives discovery.  
  Lumina translation: ship undervalued artist scoring as a product primitive.

### Phase A — Stability and Trust

- [x] Fix lint rule violations and re-run build pipeline
- [ ] Add optimistic updates with rollback on failed social writes
- [ ] Add clear loading/error toasts for follow/like/comment/profile actions
- [ ] Add profile recovery diagnostics when cache and onchain state diverge

### Phase B — Social Depth

- [x] Build an onchain activity feed MVP (conviction-note stream on `/feed`)
- [x] Add social proof modules:
  - recent likers on tracks
  - recent followers on artists
  - shared-fans view between user and artist
- [ ] Add lightweight notifications center for relevant social updates
- [x] Add artist conviction notes:
  - "Back this artist" short thesis
  - write/read via Tapestry-backed content nodes
  - display recent backers on artist pages

### Phase C — Discovery Intelligence

- [x] Add personalized rails:
  - because you followed X
  - similar genre/mood to your likes
  - rising artists from your interaction graph
- [x] Ship "Undervalued Artist Score" (`/signals`) with transparent ranking factors:
  - audience gap (attention vs follower base)
  - engagement velocity (plays/favorites/reposts)
  - consistency bonus (track count, verification, recent traction)
- [ ] Add richer filtering (genre, mood, duration, recency)
- [ ] Add saved collections/playlists tied to wallet profile

### Phase D — Reputation Layer

- [x] Add supporter reputation score:
  - reward early follows before an artist trends
  - reward quality conviction notes (engagement-weighted)
  - expose badges on profile and artist supporter modules

### Phase E — Submission Polish

- [ ] Mobile QA pass and interaction polish
- [ ] Integration test suite for critical flows
- [ ] Demo script + metrics instrumentation
- [ ] Bounty narrative docs aligned to Audius and Tapestry requirements

---

## API Keys

| Service | Environment Variable |
|---------|----------------------|
| Audius | `NEXT_PUBLIC_AUDIUS_API_KEY` |
| Tapestry | `NEXT_PUBLIC_TAPESTRY_API_KEY` |

---

## Success Criteria (Near-Term)

1. Social actions are reliable and clearly reflected in UI state.
2. Feed and social proof make engagement feel alive, not static.
3. Discovery has an opinionated signal product, not just trending-only listings.
4. Lint/build/tests pass consistently for demo readiness.
