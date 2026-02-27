const AUDIUS_API_URL = 'https://api.audius.co/v1'
const API_KEY = process.env.NEXT_PUBLIC_AUDIUS_API_KEY

interface AudiusTrackResponse {
  id: string
  title: string
  description?: string
  artwork?: {
    '150x150': string
    '480x480': string
    '1000x1000': string
  }
  duration: number
  genre?: string
  mood?: string
  play_count?: number
  favorite_count?: number
  repost_count?: number
  user: AudiusUserResponse
  created_at: string
}

interface AudiusUserResponse {
  id: string
  handle: string
  name: string
  bio?: string
  profile_picture?: {
    '150x150': string
    '480x480': string
  }
  cover_photo?: {
    '640x': string
    '2000x': string
  }
  follower_count?: number
  followee_count?: number
  track_count?: number
  is_verified?: boolean
  wallet?: string
}

interface AudiusPlaylistResponse {
  id: string
  playlist_name: string
  description?: string
  artwork?: {
    '150x150': string
    '480x480': string
    '1000x1000': string
  }
  track_count?: number
  repost_count?: number
  favorite_count?: number
  total_play_count?: number
  created_at: string
  user: AudiusUserResponse
  tracks?: AudiusTrackResponse[]
}

import type { AudiusPlaylist, AudiusTrack, AudiusUser } from '@/types'

async function fetchAudius<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = {}
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }
  
  const response = await fetch(`${AUDIUS_API_URL}${endpoint}`, { headers })
  
  if (!response.ok) {
    throw new Error(`Audius API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data as T
}

function mapTrack(track: AudiusTrackResponse): AudiusTrack {
  const streamUrl = API_KEY
    ? `${AUDIUS_API_URL}/tracks/${track.id}/stream?api_key=${API_KEY}`
    : `${AUDIUS_API_URL}/tracks/${track.id}/stream`

  return {
    id: track.id,
    title: track.title,
    description: track.description,
    artwork: track.artwork,
    stream: streamUrl,
    duration: track.duration,
    genre: track.genre,
    mood: track.mood,
    playCount: track.play_count || 0,
    favoriteCount: track.favorite_count || 0,
    repostCount: track.repost_count || 0,
    user: mapUser(track.user),
    createdAt: track.created_at,
  }
}

function mapUser(user: AudiusUserResponse): AudiusUser {
  return {
    id: user.id,
    handle: user.handle,
    name: user.name,
    bio: user.bio,
    profilePicture: user.profile_picture,
    coverPhoto: user.cover_photo,
    followerCount: user.follower_count || 0,
    followeeCount: user.followee_count || 0,
    trackCount: user.track_count || 0,
    isVerified: user.is_verified || false,
    wallet: user.wallet || '',
  }
}

function mapPlaylist(playlist: AudiusPlaylistResponse): AudiusPlaylist {
  return {
    id: playlist.id,
    name: playlist.playlist_name,
    description: playlist.description,
    artwork: playlist.artwork,
    trackCount: playlist.track_count || 0,
    repostCount: playlist.repost_count || 0,
    favoriteCount: playlist.favorite_count || 0,
    totalPlayCount: playlist.total_play_count || 0,
    createdAt: playlist.created_at,
    owner: mapUser(playlist.user),
    tracks: Array.isArray(playlist.tracks) ? playlist.tracks.map(mapTrack) : [],
  }
}

export async function getTrendingTracks(limit = 20, offset = 0): Promise<AudiusTrack[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100)
  const safeOffset = Math.max(Math.floor(offset), 0)
  const tracks = await fetchAudius<AudiusTrackResponse[]>(
    `/tracks/trending?limit=${safeLimit}&offset=${safeOffset}`
  )
  return tracks.map(mapTrack)
}

export async function getTrack(trackId: string): Promise<AudiusTrack> {
  const track = await fetchAudius<AudiusTrackResponse>(`/tracks/${trackId}`)
  return mapTrack(track)
}

export async function getPlaylist(playlistId: string): Promise<AudiusPlaylist> {
  const response = await fetchAudius<AudiusPlaylistResponse[] | AudiusPlaylistResponse>(
    `/playlists/${playlistId}`
  )
  const playlist = Array.isArray(response) ? response[0] : response
  if (!playlist) {
    throw new Error('Playlist not found')
  }
  return mapPlaylist(playlist)
}

export async function searchTracks(query: string, limit = 20): Promise<AudiusTrack[]> {
  const encodedQuery = encodeURIComponent(query)
  const tracks = await fetchAudius<AudiusTrackResponse[]>(`/tracks/search?query=${encodedQuery}&limit=${limit}`)
  return tracks.map(mapTrack)
}

export async function getUser(userId: string): Promise<AudiusUser> {
  const user = await fetchAudius<AudiusUserResponse>(`/users/${userId}`)
  return mapUser(user)
}

export async function getUserByHandle(handle: string): Promise<AudiusUser> {
  const user = await fetchAudius<AudiusUserResponse>(`/users/handle/${handle}`)
  return mapUser(user)
}

export async function getUserTracks(userId: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
  const tracks = await fetchAudius<AudiusTrackResponse[]>(`/users/${userId}/tracks?limit=${limit}&offset=${offset}`)
  return tracks.map(mapTrack)
}

/** Get unique artists from trending tracks (best way to discover popular artists) */
export async function getTrendingArtists(limit = 20): Promise<AudiusUser[]> {
  const tracks = await fetchAudius<AudiusTrackResponse[]>(`/tracks/trending?limit=50`)
  const seen = new Set<string>()
  const artists: AudiusUser[] = []
  for (const track of tracks) {
    if (!seen.has(track.user.id)) {
      seen.add(track.user.id)
      artists.push(mapUser(track.user))
      if (artists.length >= limit) break
    }
  }
  return artists
}

export async function searchUsers(query: string, limit = 20, offset = 0): Promise<AudiusUser[]> {
  const encodedQuery = encodeURIComponent(query)
  const users = await fetchAudius<AudiusUserResponse[]>(
    `/users/search?query=${encodedQuery}&limit=${limit}&offset=${offset}`
  )
  return users.map(mapUser)
}

export async function getStreamUrl(trackId: string): Promise<string> {
  const track = await fetchAudius<{ audio_properties?: { preview?: string } }>(`/tracks/${trackId}`)
  return track.audio_properties?.preview || ''
}

export function getArtworkUrl(track: AudiusTrack, size: '150x150' | '480x480' | '1000x1000' = '480x480'): string {
  if (track.artwork) {
    return track.artwork[size]
  }
  return '/placeholder-album.png'
}

export function getPlaylistArtworkUrl(
  playlist: AudiusPlaylist,
  size: '150x150' | '480x480' | '1000x1000' = '480x480'
): string {
  if (playlist.artwork) {
    return playlist.artwork[size]
  }
  const firstTrackArtwork = playlist.tracks.find((track) => Boolean(track.artwork))?.artwork
  if (firstTrackArtwork) {
    return firstTrackArtwork[size]
  }
  return '/placeholder-album.png'
}

export function getProfilePictureUrl(user: AudiusUser, size: '150x150' | '480x480' = '150x150'): string {
  if (user.profilePicture) {
    return user.profilePicture[size]
  }
  return '/placeholder-avatar.png'
}
