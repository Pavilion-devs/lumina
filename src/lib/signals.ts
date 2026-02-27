import { getTrendingTracks } from '@/lib/audius'
import type { ArtistSignal } from '@/types'

/**
 * Build an "undervalued" style artist signal from currently trending Audius tracks.
 * The score favors strong engagement relative to current follower base.
 */
export async function getUndervaluedArtistSignals(limit = 24): Promise<ArtistSignal[]> {
  const tracks = await getTrendingTracks(100, 0)

  const byArtist = new Map<string, ArtistSignal>()

  for (const track of tracks) {
    const existing = byArtist.get(track.user.id)

    if (!existing) {
      byArtist.set(track.user.id, {
        artistId: track.user.id,
        handle: track.user.handle,
        name: track.user.name,
        isVerified: track.user.isVerified,
        profilePicture: track.user.profilePicture,
        followerCount: track.user.followerCount,
        trackCount: track.user.trackCount,
        plays: track.playCount,
        favorites: track.favoriteCount,
        reposts: track.repostCount,
        appearanceCount: 1,
        signalScore: 0,
        attentionPerFollower: 0,
      })
      continue
    }

    existing.plays += track.playCount
    existing.favorites += track.favoriteCount
    existing.reposts += track.repostCount
    existing.appearanceCount += 1
    existing.followerCount = Math.max(existing.followerCount, track.user.followerCount)
    existing.trackCount = Math.max(existing.trackCount, track.user.trackCount)
  }

  const scored = Array.from(byArtist.values()).map((artist) => {
    const attentionRaw = artist.plays + artist.favorites * 4 + artist.reposts * 3
    const attention = Math.log10(attentionRaw + 10)
    const audience = Math.log10(artist.followerCount + 10)

    const attentionGap = attention / Math.max(1, audience)

    // Reward artists that consistently appear in trending but are not massively saturated.
    const consistency = Math.min(1.5, 0.7 + artist.appearanceCount / 8)
    const supplyPenalty = Math.max(0.85, 1.15 - Math.min(0.3, artist.trackCount / 400))
    const verifiedAdjustment = artist.isVerified ? 0.95 : 1

    const signalScore = attentionGap * consistency * supplyPenalty * verifiedAdjustment * 100
    const attentionPerFollower = (attentionRaw / Math.max(1, artist.followerCount)) * 1000

    return {
      ...artist,
      signalScore: Number(signalScore.toFixed(2)),
      attentionPerFollower: Number(attentionPerFollower.toFixed(2)),
    }
  })

  scored.sort((a, b) => b.signalScore - a.signalScore)
  return scored.slice(0, limit)
}
