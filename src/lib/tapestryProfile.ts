import { createProfile, getProfile, searchProfilesByWallet } from '@/lib/tapestry'
import type { TapestryProfile } from '@/types'

const PROFILE_KEY_PREFIX = 'lumina_tapestry_id_'
const DISPLAY_NAME_KEY_PREFIX = 'lumina_display_name_'
const PROFILE_UPDATED_EVENT = 'lumina_profile_updated'

const inflightByWallet = new Map<string, Promise<string | null>>()

function profileQualityScore(walletAddress: string, profile: TapestryProfile): number {
  let score = 0
  const username = profile.username?.trim().toLowerCase()
  const walletPrefix = walletAddress.slice(0, 8).toLowerCase()

  // Prefer human handles over auto-generated wallet-prefix handles.
  if (username && username !== walletPrefix) score += 50
  if (profile.bio) score += 10
  if (profile.image) score += 10
  if ((profile.followerCount ?? 0) > 0) score += 5
  if ((profile.followingCount ?? 0) > 0) score += 5

  return score
}

function pickBestWalletProfile(walletAddress: string, profiles: TapestryProfile[]): TapestryProfile | null {
  if (profiles.length === 0) return null

  const ranked = [...profiles].sort((a, b) => {
    const qualityDelta = profileQualityScore(walletAddress, b) - profileQualityScore(walletAddress, a)
    if (qualityDelta !== 0) return qualityDelta

    // For ties, prefer older profile as likely canonical identity.
    const aCreated = typeof a.created_at === 'number' ? a.created_at : Number.MAX_SAFE_INTEGER
    const bCreated = typeof b.created_at === 'number' ? b.created_at : Number.MAX_SAFE_INTEGER
    return aCreated - bCreated
  })

  return ranked[0] ?? null
}

export function profileCacheKey(walletAddress: string): string {
  return `${PROFILE_KEY_PREFIX}${walletAddress}`
}

export function displayNameCacheKey(walletAddress: string): string {
  return `${DISPLAY_NAME_KEY_PREFIX}${walletAddress}`
}

export function getCachedProfileId(walletAddress: string): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(profileCacheKey(walletAddress))
  if (!stored || stored === 'undefined' || stored === 'null') return null
  return stored
}

export function getCachedDisplayName(walletAddress: string): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(displayNameCacheKey(walletAddress))
  if (!stored) return null
  const trimmed = stored.trim()
  return trimmed ? trimmed : null
}

export function setCachedProfileId(walletAddress: string, profileId: string | undefined): void {
  if (typeof window === 'undefined') return
  if (!profileId || profileId === 'undefined' || profileId === 'null') return

  localStorage.setItem(profileCacheKey(walletAddress), profileId)
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}

export function clearCachedProfileId(walletAddress: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(profileCacheKey(walletAddress))
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}

export function setCachedDisplayName(walletAddress: string, displayName: string): void {
  if (typeof window === 'undefined') return
  const trimmed = displayName.trim()
  if (!trimmed) return
  localStorage.setItem(displayNameCacheKey(walletAddress), trimmed)
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}

export function clearCachedDisplayName(walletAddress: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(displayNameCacheKey(walletAddress))
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
}

export function subscribeProfileId(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(PROFILE_UPDATED_EVENT, handler)

  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(PROFILE_UPDATED_EVENT, handler)
  }
}

export async function findWalletProfileByUsername(
  walletAddress: string,
  username: string
): Promise<TapestryProfile | null> {
  const target = username.trim().toLowerCase()
  if (!target) return null

  try {
    const profiles = await searchProfilesByWallet(walletAddress, true, 100, 0)
    const match = profiles.find((p) => p.username?.trim().toLowerCase() === target)
    return match ?? null
  } catch (err) {
    console.error('Failed to search wallet profiles by username:', err)
    return null
  }
}

/**
 * Resolve a wallet's Tapestry profile id reliably.
 * 1) Use cached id if valid
 * 2) Recover from wallet-linked profiles (including external)
 * 3) Fallback to findOrCreate and cache
 */
export async function resolveProfileId(walletAddress: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const cachedId = getCachedProfileId(walletAddress)
  if (cachedId) {
    try {
      const existing = await getProfile(cachedId)
      if (existing?.id) {
        setCachedProfileId(walletAddress, existing.id)
        return existing.id
      }
      clearCachedProfileId(walletAddress)
    } catch (err) {
      // If profile fetch fails transiently, keep using cached id to avoid
      // accidentally minting additional wallet-linked profiles.
      console.error('Failed to validate cached profile id, using cache:', err)
      return cachedId
    }
  }

  const inflight = inflightByWallet.get(walletAddress)
  if (inflight) return inflight

  const pending = (async () => {
    try {
      // First recover from any profile already linked to this wallet
      // (including profiles created in other Tapestry-integrated apps).
      try {
        const linkedProfiles = await searchProfilesByWallet(walletAddress, true, 100, 0)
        const best = pickBestWalletProfile(walletAddress, linkedProfiles)
        if (best?.id) {
          setCachedProfileId(walletAddress, best.id)
          return best.id
        }
      } catch (err) {
        console.warn('Wallet profile search failed, falling back to findOrCreate:', err)
      }

      const found = await createProfile(walletAddress, walletAddress.slice(0, 8))
      if (found?.id) {
        setCachedProfileId(walletAddress, found.id)
        return found.id
      }
      return null
    } catch (err) {
      console.error('Failed to resolve Tapestry profile id:', err)
      return null
    } finally {
      inflightByWallet.delete(walletAddress)
    }
  })()

  inflightByWallet.set(walletAddress, pending)
  return pending
}
