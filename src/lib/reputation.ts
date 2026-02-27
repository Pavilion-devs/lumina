import type { RewardActivity } from '@/types'
import type { RewardsRecord } from '@/lib/rewards'

export interface SupporterBadge {
  id: string
  label: string
  icon: string
}

export interface SupporterMetrics {
  followCount: number
  earlyFollowCount: number
  backCount: number
  averageThesisLength: number
  commentCount: number
  likeCount: number
  activeDays: number
  uniqueArtists: number
}

export interface SupporterProfile {
  score: number
  tier: 'Newcomer' | 'Rising' | 'Scout' | 'Legend'
  metrics: SupporterMetrics
  badges: SupporterBadge[]
}

export interface ArtistCommunityEntry {
  wallet: string
  timestamp?: string
  supporterScore: number
  topBadge?: SupporterBadge
  engagementScore?: number
}

export interface ArtistCommunitySnapshot {
  recentFollowers: ArtistCommunityEntry[]
  recentBackers: ArtistCommunityEntry[]
  sharedFans: ArtistCommunityEntry[]
}

const BADGE_DEFINITIONS: Record<string, SupporterBadge> = {
  early_backer: { id: 'early_backer', label: 'Early Backer', icon: 'solar:rocket-bold-duotone' },
  conviction_writer: { id: 'conviction_writer', label: 'Conviction Writer', icon: 'solar:pen-new-square-bold-duotone' },
  social_catalyst: { id: 'social_catalyst', label: 'Social Catalyst', icon: 'solar:chat-round-dots-bold-duotone' },
  taste_curator: { id: 'taste_curator', label: 'Taste Curator', icon: 'solar:heart-bold-duotone' },
  loyal_listener: { id: 'loyal_listener', label: 'Loyal Listener', icon: 'solar:music-note-bold-duotone' },
  scene_scout: { id: 'scene_scout', label: 'Scene Scout', icon: 'solar:star-bold-duotone' },
}

function toDayKey(timestamp: string): string {
  return timestamp.slice(0, 10)
}

function readNumber(activity: RewardActivity, key: string): number | null {
  const value = activity[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function countArtistSet(activities: RewardActivity[]): number {
  const artistSet = new Set<string>()
  activities.forEach((activity) => {
    if (typeof activity.artistId === 'string' && activity.artistId.length > 0) {
      artistSet.add(activity.artistId)
    }
  })
  return artistSet.size
}

export function computeSupporterProfile(totalPoints: number, activities: RewardActivity[]): SupporterProfile {
  const follows = activities.filter((a) => a.action === 'FOLLOW_ARTIST')
  const backs = activities.filter((a) => a.action === 'BACK_ARTIST')
  const comments = activities.filter((a) => a.action === 'COMMENT')
  const likes = activities.filter((a) => a.action === 'LIKE_TRACK')

  const earlyFollowCount = follows.filter((a) => {
    const followerCount = readNumber(a, 'artistFollowerCount')
    return followerCount !== null && followerCount <= 5000
  }).length

  const thesisLengths = backs
    .map((a) => readNumber(a, 'noteLength'))
    .filter((value): value is number => value !== null)

  const averageThesisLength = thesisLengths.length
    ? Math.round(thesisLengths.reduce((sum, value) => sum + value, 0) / thesisLengths.length)
    : 0

  const activeDays = new Set(activities.map((a) => toDayKey(a.timestamp))).size
  const uniqueArtists = countArtistSet(activities)

  const earlyScore = Math.min(25, earlyFollowCount * 8 + Math.max(0, follows.length - earlyFollowCount) * 2)
  const convictionScore = Math.min(24, backs.length * 6 + Math.floor(averageThesisLength / 30))
  const consistencyScore = Math.min(18, activeDays * 2)
  const socialScore = Math.min(16, comments.length * 3 + uniqueArtists * 2)
  const loyaltyScore = Math.min(17, Math.floor(totalPoints / 70))

  const score = Math.max(0, Math.min(100, earlyScore + convictionScore + consistencyScore + socialScore + loyaltyScore))

  const badges: SupporterBadge[] = []
  if (earlyFollowCount >= 2) badges.push(BADGE_DEFINITIONS.early_backer)
  if (backs.length >= 2 && averageThesisLength >= 70) badges.push(BADGE_DEFINITIONS.conviction_writer)
  if (comments.length >= 3) badges.push(BADGE_DEFINITIONS.social_catalyst)
  if (likes.length >= 8) badges.push(BADGE_DEFINITIONS.taste_curator)
  if (activeDays >= 7) badges.push(BADGE_DEFINITIONS.loyal_listener)
  if (uniqueArtists >= 5) badges.push(BADGE_DEFINITIONS.scene_scout)

  let tier: SupporterProfile['tier'] = 'Newcomer'
  if (score >= 80) tier = 'Legend'
  else if (score >= 60) tier = 'Scout'
  else if (score >= 40) tier = 'Rising'

  return {
    score,
    tier,
    metrics: {
      followCount: follows.length,
      earlyFollowCount,
      backCount: backs.length,
      averageThesisLength,
      commentCount: comments.length,
      likeCount: likes.length,
      activeDays,
      uniqueArtists,
    },
    badges: badges.slice(0, 3),
  }
}

function summarizeWallet(record: RewardsRecord): { supporterScore: number; topBadge?: SupporterBadge } {
  const supporter = computeSupporterProfile(record.points, record.activities)
  return {
    supporterScore: supporter.score,
    topBadge: supporter.badges[0],
  }
}

function toTrackIdSet(trackIds: string[]): Set<string> {
  return new Set(trackIds.filter((id) => id.length > 0))
}

export function computeArtistCommunitySnapshot(
  records: RewardsRecord[],
  artistId: string,
  trackIds: string[],
  viewerWallet?: string
): ArtistCommunitySnapshot {
  const trackSet = toTrackIdSet(trackIds)

  const recentFollowersMap = new Map<string, string>()
  const recentBackersMap = new Map<string, string>()
  const viewer = viewerWallet ? records.find((r) => r.wallet === viewerWallet) : undefined

  const viewerTrackInteractions = new Set<string>()
  const viewerBackedArtist = Boolean(
    viewer?.activities.some((a) => a.action === 'BACK_ARTIST' && a.artistId === artistId)
  )

  if (viewer) {
    viewer.activities.forEach((activity) => {
      if (
        (activity.action === 'LIKE_TRACK' || activity.action === 'COMMENT') &&
        typeof activity.trackId === 'string' &&
        trackSet.has(activity.trackId)
      ) {
        viewerTrackInteractions.add(activity.trackId)
      }
    })
  }

  const sharedFans: ArtistCommunityEntry[] = []

  records.forEach((record) => {
    record.activities.forEach((activity) => {
      if (activity.action === 'FOLLOW_ARTIST' && activity.artistId === artistId) {
        const current = recentFollowersMap.get(record.wallet)
        if (!current || current < activity.timestamp) recentFollowersMap.set(record.wallet, activity.timestamp)
      }
      if (activity.action === 'BACK_ARTIST' && activity.artistId === artistId) {
        const current = recentBackersMap.get(record.wallet)
        if (!current || current < activity.timestamp) recentBackersMap.set(record.wallet, activity.timestamp)
      }
    })

    if (viewerWallet && record.wallet === viewerWallet) return

    let engagementScore = 0
    let overlapScore = 0

    record.activities.forEach((activity) => {
      if (activity.action === 'FOLLOW_ARTIST' && activity.artistId === artistId) {
        engagementScore += 3
      }
      if (activity.action === 'BACK_ARTIST' && activity.artistId === artistId) {
        engagementScore += 5
        if (viewerBackedArtist) overlapScore += 2
      }
      if (
        (activity.action === 'LIKE_TRACK' || activity.action === 'COMMENT') &&
        typeof activity.trackId === 'string' &&
        trackSet.has(activity.trackId)
      ) {
        engagementScore += activity.action === 'COMMENT' ? 3 : 2
        if (viewerTrackInteractions.has(activity.trackId)) overlapScore += 2
      }
    })

    const totalSharedScore = engagementScore + overlapScore
    if (totalSharedScore <= 0) return

    const walletSummary = summarizeWallet(record)
    sharedFans.push({
      wallet: record.wallet,
      supporterScore: walletSummary.supporterScore,
      topBadge: walletSummary.topBadge,
      engagementScore: totalSharedScore,
    })
  })

  const recentFollowers = Array.from(recentFollowersMap.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 6)
    .map(([wallet, timestamp]) => {
      const record = records.find((item) => item.wallet === wallet)
      const summary = record ? summarizeWallet(record) : { supporterScore: 0 }
      return {
        wallet,
        timestamp,
        supporterScore: summary.supporterScore,
        topBadge: summary.topBadge,
      }
    })

  const recentBackers = Array.from(recentBackersMap.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 6)
    .map(([wallet, timestamp]) => {
      const record = records.find((item) => item.wallet === wallet)
      const summary = record ? summarizeWallet(record) : { supporterScore: 0 }
      return {
        wallet,
        timestamp,
        supporterScore: summary.supporterScore,
        topBadge: summary.topBadge,
      }
    })

  const rankedSharedFans = sharedFans
    .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))
    .slice(0, 6)

  return {
    recentFollowers,
    recentBackers,
    sharedFans: rankedSharedFans,
  }
}

