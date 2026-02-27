import type { TapestryProfile, TapestryFollow, TapestryComment } from '@/types'

// All requests go through the local proxy at /api/tapestry/
// which forwards them server-side to api.usetapestry.dev (bypassing CORS).
const API_URL = '/api/tapestry/'

function normalizeProfile(profile: TapestryProfile): TapestryProfile {
  const normalized = { ...profile }
  const custom = normalized.customProperties

  if ((!normalized.bio || normalized.bio.length === 0) && custom && typeof custom.bio === 'string') {
    normalized.bio = custom.bio
  }

  if ((!normalized.image || normalized.image.length === 0) && custom && typeof custom.profileImage === 'string') {
    normalized.image = custom.profileImage
  }

  return normalized
}

async function tapestryFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const text = await response.text()
  let payload: unknown = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }

  if (!response.ok) {
    let message: string | undefined
    if (typeof payload === 'object' && payload !== null) {
      const obj = payload as Record<string, unknown>
      if (typeof obj.message === 'string') message = obj.message
      else if (typeof obj.error === 'string') message = obj.error
      else if (
        typeof obj.error === 'object' &&
        obj.error !== null &&
        typeof (obj.error as Record<string, unknown>).message === 'string'
      ) {
        message = (obj.error as Record<string, unknown>).message as string
      } else if (typeof obj.detail === 'string') {
        message = obj.detail
      }
    }

    throw new Error(
      `Tapestry API error: ${response.status} ${response.statusText}${message ? ` - ${message}` : ''}`
    )
  }

  return payload as T
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function createProfile(
  walletAddress: string,
  username: string,
  bio?: string,
  image?: string
): Promise<TapestryProfile> {
  // findOrCreate returns { profile: {...}, operation, walletAddress }
  const response = await tapestryFetch<{
    profile: TapestryProfile
    operation: string
    walletAddress: string
    socialCounts?: { followers: number; following: number }
  }>('profiles/findOrCreate', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      username,
      bio: bio || '',
      image: image || '',
      blockchain: 'SOLANA',
      execution: 'FAST_UNCONFIRMED',
    }),
  })

  const profile = normalizeProfile(response.profile)
  if (response.walletAddress) profile.walletAddress = response.walletAddress
  if (response.socialCounts) {
    profile.followerCount = response.socialCounts.followers ?? 0
    profile.followingCount = response.socialCounts.following ?? 0
  }
  return profile
}

export async function getProfile(profileId: string): Promise<TapestryProfile | null> {
  try {
    // GET /profiles/{id} returns { profile, walletAddress, namespace, socialCounts }
    const response = await tapestryFetch<{
      profile: TapestryProfile
      walletAddress?: string
      socialCounts?: { followers: number; following: number }
    }>(`profiles/${profileId}`)

    const profile = normalizeProfile(response.profile)
    if (response.walletAddress) profile.walletAddress = response.walletAddress
    if (response.socialCounts) {
      profile.followerCount = response.socialCounts.followers ?? 0
      profile.followingCount = response.socialCounts.following ?? 0
    }
    return profile
  } catch {
    return null
  }
}

export async function updateProfile(
  profileId: string,
  data: { bio?: string; image?: string }
): Promise<TapestryProfile> {
  // Tapestry deployments have shown slight schema differences for update payloads.
  // Try documented shape first, then compatibility fallbacks.
  const customProperties: Array<{ key: string; value: string }> = []
  const customPropertiesObject: Record<string, string> = {}
  if (data.bio !== undefined) {
    customProperties.push({ key: 'bio', value: data.bio })
    customPropertiesObject.bio = data.bio
  }
  if (typeof data.image === 'string' && data.image.trim().length > 0) {
    customProperties.push({ key: 'profileImage', value: data.image })
    customPropertiesObject.profileImage = data.image
  }

  const attempts: Array<{ endpoint: string; body: Record<string, unknown> }> = [
    {
      endpoint: 'profiles/update',
      body: {
        profileId,
        ...(customProperties.length > 0 ? { customProperties } : {}),
        blockchain: 'SOLANA',
        execution: 'FAST_UNCONFIRMED',
      },
    },
    {
      endpoint: 'profiles/update',
      body: {
        profileId,
        ...(Object.keys(customPropertiesObject).length > 0 ? { customProperties: customPropertiesObject } : {}),
      },
    },
    {
      endpoint: 'profiles/update',
      body: {
        profileId,
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(typeof data.image === 'string' && data.image.trim().length > 0 ? { image: data.image } : {}),
      },
    },
    {
      endpoint: `profiles/${profileId}`,
      body: {
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(typeof data.image === 'string' && data.image.trim().length > 0 ? { image: data.image } : {}),
        ...(Object.keys(customPropertiesObject).length > 0 ? { customProperties: customPropertiesObject } : {}),
      },
    },
  ]

  const errors: string[] = []

  for (const attempt of attempts) {
    try {
      const response = await tapestryFetch<TapestryProfile | { profile: TapestryProfile }>(
        attempt.endpoint,
        {
          method: 'PUT',
          body: JSON.stringify(attempt.body),
        }
      )

      if ('profile' in response && typeof response.profile === 'object') {
        return normalizeProfile(response.profile)
      }
      return normalizeProfile(response as TapestryProfile)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  throw new Error(errors[0] ?? 'Tapestry API error: Failed to update profile')
}

export async function searchProfilesByWallet(
  walletAddress: string,
  includeExternalProfiles = true,
  limit = 50,
  offset = 0
): Promise<TapestryProfile[]> {
  const query = includeExternalProfiles
    ? 'profiles/search?shouldIncludeExternalProfiles=true'
    : 'profiles/search'

  try {
    const response = await tapestryFetch<{
      profiles: TapestryProfile[]
    }>(query, {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        limit,
        offset,
      }),
    })

    return response.profiles ?? []
  } catch (err) {
    // Some API environments may not expose /profiles/search yet.
    // Keep resolution flow working by treating this as a non-fatal miss.
    if (err instanceof Error && err.message.includes('404')) {
      return []
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Follows — POST /followers/add and POST /followers/remove
//           Both endpoints require startId and endId to be Tapestry profiles.
//           For Audius artists, we auto-create a Tapestry profile via findOrCreate.
// ---------------------------------------------------------------------------

const ensuredArtistProfiles = new Set<string>()

/** Convert an Audius artist ID to a Tapestry profile username */
function toArtistProfileId(audiusArtistId: string): string {
  return `audius-artist-${audiusArtistId}`
}

/** Ensure a Tapestry profile exists for an Audius artist. */
async function ensureArtistProfile(audiusArtistId: string): Promise<string> {
  const profileId = toArtistProfileId(audiusArtistId)
  if (ensuredArtistProfiles.has(profileId)) return profileId
  try {
    // Use a deterministic placeholder wallet (32+ chars required)
    const fakeWallet = `audius-${audiusArtistId}-000000000000000000000000000`
    await tapestryFetch('profiles/findOrCreate', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress: fakeWallet.slice(0, 44),
        username: profileId,
        blockchain: 'SOLANA',
        execution: 'FAST_UNCONFIRMED',
      }),
    })
    ensuredArtistProfiles.add(profileId)
  } catch (err) {
    console.error('[tapestry] Failed to ensure artist profile:', err)
  }
  return profileId
}

export async function followUser(followerId: string, audiusArtistId: string): Promise<TapestryFollow> {
  const endId = await ensureArtistProfile(audiusArtistId)
  await tapestryFetch('followers/add', {
    method: 'POST',
    body: JSON.stringify({ startId: followerId, endId }),
  })
  return { startId: followerId, endId, createdAt: new Date().toISOString() }
}

export async function unfollowUser(followerId: string, audiusArtistId: string): Promise<void> {
  const endId = toArtistProfileId(audiusArtistId)
  await tapestryFetch('followers/remove', {
    method: 'POST',
    body: JSON.stringify({ startId: followerId, endId }),
  })
}

export async function isFollowing(followerId: string, audiusArtistId: string): Promise<boolean> {
  // No dedicated check endpoint; track locally via localStorage
  if (typeof window === 'undefined') return false
  const key = `lumina_follow_${followerId}:${toArtistProfileId(audiusArtistId)}`
  return localStorage.getItem(key) === '1'
}

/** Helper: update local follow tracking after follow/unfollow */
export function setLocalFollowState(followerId: string, audiusArtistId: string, following: boolean): void {
  if (typeof window === 'undefined') return
  const key = `lumina_follow_${followerId}:${toArtistProfileId(audiusArtistId)}`
  if (following) {
    localStorage.setItem(key, '1')
  } else {
    localStorage.removeItem(key)
  }
}

// ---------------------------------------------------------------------------
// Content — must create content nodes in Tapestry before liking/commenting.
// Uses POST /contents/findOrCreate with { id, profileId, properties }.
// We prefix Audius IDs with "audius-track-" to create unique Tapestry node IDs.
// ---------------------------------------------------------------------------

const ensuredContentIds = new Set<string>()

/** Convert an Audius track ID to a Tapestry content node ID */
export function toContentNodeId(audiusTrackId: string): string {
  return `audius-track-${audiusTrackId}`
}

/** Ensure a content node exists in Tapestry. Safe to call multiple times. */
export async function ensureContentExists(
  profileId: string,
  audiusTrackId: string
): Promise<void> {
  const nodeId = toContentNodeId(audiusTrackId)
  if (ensuredContentIds.has(nodeId)) return
  try {
    await tapestryFetch('contents/findOrCreate', {
      method: 'POST',
      body: JSON.stringify({
        id: nodeId,
        profileId,
        properties: [
          { key: 'contentType', value: 'TRACK' },
          { key: 'source', value: 'audius' },
          { key: 'audiusId', value: audiusTrackId },
        ],
      }),
    })
    ensuredContentIds.add(nodeId)
  } catch (err) {
    console.error('[tapestry] Failed to ensure content node:', err)
  }
}

// ---------------------------------------------------------------------------
// Likes — GET/POST/DELETE /likes/{nodeId}
//         POST/DELETE body: { startId: profileId }
//         GET response: { profiles: [...], total: N }
// ---------------------------------------------------------------------------

export async function likeContent(profileId: string, audiusTrackId: string): Promise<unknown> {
  await ensureContentExists(profileId, audiusTrackId)
  const nodeId = toContentNodeId(audiusTrackId)
  return tapestryFetch(`likes/${nodeId}`, {
    method: 'POST',
    body: JSON.stringify({ startId: profileId }),
  })
}

export async function unlikeContent(profileId: string, audiusTrackId: string): Promise<void> {
  const nodeId = toContentNodeId(audiusTrackId)
  await tapestryFetch(`likes/${nodeId}`, {
    method: 'DELETE',
    body: JSON.stringify({ startId: profileId }),
  })
}

export async function getLikesByContent(audiusTrackId: string): Promise<{ profiles: TapestryProfile[]; total: number }> {
  const nodeId = toContentNodeId(audiusTrackId)
  try {
    return await tapestryFetch<{ profiles: TapestryProfile[]; total: number }>(`likes/${nodeId}`)
  } catch {
    return { profiles: [], total: 0 }
  }
}

export async function hasLiked(profileId: string, audiusTrackId: string): Promise<boolean> {
  try {
    const { profiles } = await getLikesByContent(audiusTrackId)
    return profiles.some((p) => p.id === profileId)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Comments — POST /comments with { profileId, contentId, text }
//            GET  /comments?contentId=X
//            Response: { comments: [{ comment, author, socialCounts }] }
// ---------------------------------------------------------------------------

export async function createComment(
  profileId: string,
  audiusTrackId: string,
  text: string
): Promise<TapestryComment> {
  await ensureContentExists(profileId, audiusTrackId)
  const nodeId = toContentNodeId(audiusTrackId)
  return tapestryFetch<TapestryComment>('comments', {
    method: 'POST',
    body: JSON.stringify({
      profileId,
      contentId: nodeId,
      text,
    }),
  })
}

export async function getComments(audiusTrackId: string, limit = 20, offset = 0): Promise<TapestryComment[]> {
  const nodeId = toContentNodeId(audiusTrackId)
  try {
    const response = await tapestryFetch<{
      comments: Array<{
        comment: { id: string; text: string; created_at: number }
        author: { id: string; username: string; image?: string }
        socialCounts?: { likeCount: number }
      }>
      page: number
      pageSize: number
    }>(`comments?contentId=${nodeId}&limit=${limit}&offset=${offset}`)
    // Map nested response to flat TapestryComment shape
    return (response.comments ?? []).map((c) => ({
      id: c.comment.id,
      profileId: c.author.id,
      contentId: nodeId,
      text: c.comment.text,
      createdAt: new Date(c.comment.created_at).toISOString(),
      author: c.author,
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Artist conviction notes (backing theses) using Tapestry comments
// ---------------------------------------------------------------------------

const ensuredArtistSignalIds = new Set<string>()

function toArtistSignalNodeId(audiusArtistId: string): string {
  return `audius-artist-signal-${audiusArtistId}`
}

async function ensureArtistSignalExists(profileId: string, audiusArtistId: string): Promise<string> {
  const nodeId = toArtistSignalNodeId(audiusArtistId)
  if (ensuredArtistSignalIds.has(nodeId)) return nodeId

  try {
    await tapestryFetch('contents/findOrCreate', {
      method: 'POST',
      body: JSON.stringify({
        id: nodeId,
        profileId,
        properties: [
          { key: 'contentType', value: 'ARTIST_SIGNAL' },
          { key: 'source', value: 'audius' },
          { key: 'audiusArtistId', value: audiusArtistId },
        ],
      }),
    })
    ensuredArtistSignalIds.add(nodeId)
  } catch (err) {
    console.error('[tapestry] Failed to ensure artist signal node:', err)
  }

  return nodeId
}

export async function createArtistSignal(
  profileId: string,
  audiusArtistId: string,
  text: string
): Promise<TapestryComment> {
  const nodeId = await ensureArtistSignalExists(profileId, audiusArtistId)
  return tapestryFetch<TapestryComment>('comments', {
    method: 'POST',
    body: JSON.stringify({
      profileId,
      contentId: nodeId,
      text,
    }),
  })
}

export async function getArtistSignals(audiusArtistId: string, limit = 20, offset = 0): Promise<TapestryComment[]> {
  const nodeId = toArtistSignalNodeId(audiusArtistId)
  try {
    const response = await tapestryFetch<{
      comments: Array<{
        comment: { id: string; text: string; created_at: number }
        author: { id: string; username: string; image?: string }
      }>
    }>(`comments?contentId=${nodeId}&limit=${limit}&offset=${offset}`)

    return (response.comments ?? []).map((c) => ({
      id: c.comment.id,
      profileId: c.author.id,
      contentId: nodeId,
      text: c.comment.text,
      createdAt: new Date(c.comment.created_at).toISOString(),
      author: c.author,
    }))
  } catch {
    return []
  }
}
