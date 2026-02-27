import { REWARD_POINTS } from '@/types'
import type { RewardActivity } from '@/types'

const REWARDS_STORAGE_KEY = 'soundSocial_rewards'
const REWARDS_UPDATED_EVENT = 'lumina_rewards_updated'

interface StoredRewards {
  totalPoints: number
  activities: RewardActivity[]
}

type RewardsSnapshot = {
  totalPoints: number
  recentActivity: StoredRewards['activities']
}

type LeaderboardEntry = { wallet: string; points: number; rank: number }
export type RewardsRecord = { wallet: string; points: number; activities: RewardActivity[] }

const EMPTY_ACTIVITY: StoredRewards['activities'] = []
const EMPTY_REWARDS_SNAPSHOT: RewardsSnapshot = {
  totalPoints: 0,
  recentActivity: EMPTY_ACTIVITY,
}
const EMPTY_LEADERBOARD: LeaderboardEntry[] = []

const rewardsSnapshotCache = new Map<string, { raw: string; snapshot: RewardsSnapshot }>()
const leaderboardCache = new Map<number, { fingerprint: string; entries: LeaderboardEntry[] }>()

function rewardsStorageKey(walletAddress: string): string {
  return `${REWARDS_STORAGE_KEY}_${walletAddress}`
}

function parseStoredRewards(raw: string | null): StoredRewards {
  if (!raw) return { totalPoints: 0, activities: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredRewards>
    return {
      totalPoints: Number(parsed.totalPoints ?? 0),
      activities: Array.isArray(parsed.activities)
        ? parsed.activities
            .filter((a): a is StoredRewards['activities'][number] =>
              Boolean(a && typeof a.action === 'string' && typeof a.points === 'number' && typeof a.timestamp === 'string')
            )
            .map((a) => ({ ...a }))
        : [],
    }
  } catch {
    return { totalPoints: 0, activities: [] }
  }
}

function getStoredRewards(walletAddress: string): StoredRewards {
  if (typeof window === 'undefined') {
    return { totalPoints: 0, activities: [] }
  }
  
  return parseStoredRewards(localStorage.getItem(rewardsStorageKey(walletAddress)))
}

function saveRewards(walletAddress: string, rewards: StoredRewards): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(rewardsStorageKey(walletAddress), JSON.stringify(rewards))
  window.dispatchEvent(new Event(REWARDS_UPDATED_EVENT))
}

export function addPoints(
  walletAddress: string,
  action: keyof typeof REWARD_POINTS,
  metadata?: Record<string, unknown>
): number {
  const points = REWARD_POINTS[action]
  const rewards = getStoredRewards(walletAddress)
  
  rewards.totalPoints += points
  rewards.activities.unshift({
    action,
    points,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
  
  saveRewards(walletAddress, rewards)
  return rewards.totalPoints
}

export function getTotalPoints(walletAddress: string): number {
  return getStoredRewards(walletAddress).totalPoints
}

export function getRecentActivity(walletAddress: string, limit = 10): StoredRewards['activities'] {
  const rewards = getStoredRewards(walletAddress)
  return rewards.activities.slice(0, limit)
}

export function getActivitiesForWallet(walletAddress: string, limit?: number): RewardActivity[] {
  const rewards = getStoredRewards(walletAddress)
  return typeof limit === 'number' ? rewards.activities.slice(0, limit) : rewards.activities
}

export function getAllRewardsRecords(): RewardsRecord[] {
  if (typeof window === 'undefined') return []

  const records: RewardsRecord[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(`${REWARDS_STORAGE_KEY}_`)) continue

    const wallet = key.replace(`${REWARDS_STORAGE_KEY}_`, '')
    const stored = localStorage.getItem(key)
    if (!stored) continue

    const rewards = parseStoredRewards(stored)
    records.push({
      wallet,
      points: rewards.totalPoints,
      activities: rewards.activities,
    })
  }

  return records
}

export function getRewardsSnapshot(
  walletAddress: string | undefined,
  activityLimit = 10
): RewardsSnapshot {
  if (!walletAddress || typeof window === 'undefined') return EMPTY_REWARDS_SNAPSHOT

  const raw = localStorage.getItem(rewardsStorageKey(walletAddress)) ?? ''
  const cacheKey = `${walletAddress}:${activityLimit}`
  const cached = rewardsSnapshotCache.get(cacheKey)
  if (cached && cached.raw === raw) return cached.snapshot

  const rewards = parseStoredRewards(raw || null)
  const snapshot: RewardsSnapshot = {
    totalPoints: rewards.totalPoints,
    recentActivity: rewards.activities.slice(0, activityLimit),
  }

  rewardsSnapshotCache.set(cacheKey, { raw, snapshot })
  return snapshot
}

export function getServerRewardsSnapshot(): RewardsSnapshot {
  return EMPTY_REWARDS_SNAPSHOT
}

export function subscribeRewards(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(REWARDS_UPDATED_EVENT, handler)

  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(REWARDS_UPDATED_EVENT, handler)
  }
}

export function getLeaderboard(limit = 10): LeaderboardEntry[] {
  if (typeof window === 'undefined') return EMPTY_LEADERBOARD
  
  const leaderboard: Array<{ wallet: string; points: number }> = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(REWARDS_STORAGE_KEY)) {
      const wallet = key.replace(`${REWARDS_STORAGE_KEY}_`, '')
      const stored = localStorage.getItem(key)
      if (stored) {
        const rewards = parseStoredRewards(stored)
        leaderboard.push({ wallet, points: rewards.totalPoints })
      }
    }
  }
  
  leaderboard.sort((a, b) => b.points - a.points)

  const fingerprint = leaderboard.map((entry) => `${entry.wallet}:${entry.points}`).join('|')
  const cached = leaderboardCache.get(limit)
  if (cached && cached.fingerprint === fingerprint) return cached.entries

  const entries = leaderboard.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
  leaderboardCache.set(limit, { fingerprint, entries })
  return entries
}

export function getServerLeaderboardSnapshot(): LeaderboardEntry[] {
  return EMPTY_LEADERBOARD
}

export { REWARD_POINTS }
