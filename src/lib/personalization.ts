import { getTrack, getTrendingTracks, getUser, getUserTracks } from '@/lib/audius'
import type { AudiusTrack, AudiusUser, RewardActivity } from '@/types'

export interface PersonalizedRail {
  id: 'because_followed' | 'similar_likes' | 'rising_graph'
  title: string
  subtitle: string
  artists: AudiusUser[]
}

type ArtistStat = {
  user: AudiusUser
  genres: Set<string>
  moods: Set<string>
  engagementRaw: number
  followerCount: number
}

function normalizeToken(value?: string): string {
  return (value ?? '').trim().toLowerCase()
}

function toTitleCase(token: string): string {
  if (!token) return token
  return token
    .split(' ')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function pushUnique<T extends { id: string }>(items: T[], limit: number): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

function buildArtistStats(tracks: AudiusTrack[]): Map<string, ArtistStat> {
  const byArtist = new Map<string, ArtistStat>()

  for (const track of tracks) {
    const id = track.user.id
    const genre = normalizeToken(track.genre)
    const mood = normalizeToken(track.mood)
    const engagement = track.playCount + track.favoriteCount * 4 + track.repostCount * 3

    const existing = byArtist.get(id)
    if (!existing) {
      byArtist.set(id, {
        user: track.user,
        genres: new Set(genre ? [genre] : []),
        moods: new Set(mood ? [mood] : []),
        engagementRaw: engagement,
        followerCount: track.user.followerCount,
      })
      continue
    }

    if (genre) existing.genres.add(genre)
    if (mood) existing.moods.add(mood)
    existing.engagementRaw += engagement
    existing.followerCount = Math.max(existing.followerCount, track.user.followerCount)
    if (track.user.followerCount > existing.user.followerCount) {
      existing.user = track.user
    }
  }

  return byArtist
}

function countOverlap(set: Set<string>, targets: Set<string>): number {
  let overlap = 0
  for (const value of set) {
    if (targets.has(value)) overlap += 1
  }
  return overlap
}

function topTokens(tokens: string[], limit: number): string[] {
  const count = new Map<string, number>()
  for (const token of tokens) {
    if (!token) continue
    count.set(token, (count.get(token) ?? 0) + 1)
  }
  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token)
}

function activityArtistIds(activities: RewardActivity[]): string[] {
  return activities
    .filter((activity) => activity.action === 'FOLLOW_ARTIST' && typeof activity.artistId === 'string')
    .map((activity) => activity.artistId as string)
}

function likedTrackIds(activities: RewardActivity[]): string[] {
  return activities
    .filter(
      (activity) =>
        (activity.action === 'LIKE_TRACK' || activity.action === 'COMMENT') && typeof activity.trackId === 'string'
    )
    .map((activity) => activity.trackId as string)
}

function scoreRising(stat: ArtistStat, preferredGenres: Set<string>, preferredMoods: Set<string>): number {
  const apf = (stat.engagementRaw / Math.max(1, stat.followerCount)) * 1000
  const genreBoost = countOverlap(stat.genres, preferredGenres) * 10
  const moodBoost = countOverlap(stat.moods, preferredMoods) * 6
  const followerBoost = stat.followerCount > 0 ? Math.max(0, 20 - Math.log10(stat.followerCount + 10) * 4) : 20
  return apf + genreBoost + moodBoost + followerBoost
}

async function getTrendingPool(): Promise<AudiusTrack[]> {
  const requests = [
    getTrendingTracks(100, 0),
    getTrendingTracks(100, 100),
  ]

  const settled = await Promise.allSettled(requests)
  const tracks: AudiusTrack[] = []

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      tracks.push(...result.value)
    }
  }

  if (tracks.length === 0) {
    const firstError = settled.find((item) => item.status === 'rejected')
    throw firstError?.status === 'rejected'
      ? firstError.reason
      : new Error('Failed to load trending tracks for personalization')
  }

  return tracks
}

export async function getPersonalizedDiscoveryRails(
  activities: RewardActivity[]
): Promise<PersonalizedRail[]> {
  const followIds = activityArtistIds(activities)
  const likedIds = likedTrackIds(activities)

  if (followIds.length === 0 && likedIds.length === 0) return []

  const trendingTracks = await getTrendingPool()
  const artistStats = buildArtistStats(trendingTracks)
  const interactedArtistSet = new Set<string>([
    ...followIds,
    ...activities
      .filter((activity) => activity.action === 'BACK_ARTIST' && typeof activity.artistId === 'string')
      .map((activity) => activity.artistId as string),
  ])

  const likedTrackSample = pushUnique(
    likedIds.map((id) => ({ id })),
    8
  ).map((item) => item.id)

  const trackDetails = await Promise.all(
    likedTrackSample.map(async (trackId) => {
      try {
        return await getTrack(trackId)
      } catch {
        return null
      }
    })
  )
  const validLikedTracks = trackDetails.filter((track): track is AudiusTrack => Boolean(track))

  const preferredGenres = new Set<string>(
    topTokens(validLikedTracks.map((track) => normalizeToken(track.genre)), 3)
  )
  const preferredMoods = new Set<string>(topTokens(validLikedTracks.map((track) => normalizeToken(track.mood)), 2))

  const rails: PersonalizedRail[] = []
  const globallyUsed = new Set<string>()

  if (followIds.length > 0) {
    const seedId = followIds[0]
    let seedName = 'your follows'
    let seedGenres = new Set<string>(preferredGenres)

    try {
      const [seedUser, seedTracks] = await Promise.all([getUser(seedId), getUserTracks(seedId, 20, 0)])
      seedName = seedUser.name
      const fromSeed = topTokens(seedTracks.map((track) => normalizeToken(track.genre)), 3)
      if (fromSeed.length > 0) {
        seedGenres = new Set(fromSeed)
      }
    } catch {
      // fallback to preferences inferred from local interaction history
    }

    const becauseFollowed = Array.from(artistStats.values())
      .filter((stat) => !interactedArtistSet.has(stat.user.id))
      .map((stat) => ({
        user: stat.user,
        score:
          countOverlap(stat.genres, seedGenres) * 16 +
          countOverlap(stat.moods, preferredMoods) * 4 +
          stat.engagementRaw / Math.max(1, stat.followerCount) +
          (stat.user.isVerified ? 0.5 : 1.5),
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.user)
      .filter((user) => !globallyUsed.has(user.id))

    const artists = pushUnique(becauseFollowed, 6)
    artists.forEach((artist) => globallyUsed.add(artist.id))

    if (artists.length > 0) {
      rails.push({
        id: 'because_followed',
        title: `Because You Followed ${seedName}`,
        subtitle: 'Adjacent artists with overlapping listener behavior and attention patterns.',
        artists,
      })
    }
  }

  if (preferredGenres.size > 0 || preferredMoods.size > 0) {
    const similarToLikes = Array.from(artistStats.values())
      .map((stat) => ({
        user: stat.user,
        score:
          countOverlap(stat.genres, preferredGenres) * 18 +
          countOverlap(stat.moods, preferredMoods) * 10 +
          stat.engagementRaw / Math.max(1, stat.followerCount),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.user)
      .filter((user) => !globallyUsed.has(user.id))

    const artists = pushUnique(similarToLikes, 6)
    artists.forEach((artist) => globallyUsed.add(artist.id))

    const genreLabel = Array.from(preferredGenres).slice(0, 2).map(toTitleCase).join(' · ')
    rails.push({
      id: 'similar_likes',
      title: 'Similar To Your Likes',
      subtitle: genreLabel
        ? `Calibrated from your recent listening actions around ${genreLabel}.`
        : 'Calibrated from your recent likes and comments.',
      artists,
    })
  }

  const risingCandidates = Array.from(artistStats.values())
    .filter((stat) => !interactedArtistSet.has(stat.user.id))
    .map((stat) => ({
      user: stat.user,
      score: scoreRising(stat, preferredGenres, preferredMoods),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.user)
    .filter((user) => !globallyUsed.has(user.id))

  const risingArtists = pushUnique(risingCandidates, 6)
  if (risingArtists.length > 0) {
    rails.push({
      id: 'rising_graph',
      title: 'Rising In Your Graph',
      subtitle: 'Undervalued artists with strong engagement-per-follower momentum.',
      artists: risingArtists,
    })
  }

  return rails.filter((rail) => rail.artists.length > 0)
}
