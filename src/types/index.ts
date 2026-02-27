export interface AudiusTrack {
  id: string
  title: string
  description?: string
  artwork?: {
    '150x150': string
    '480x480': string
    '1000x1000': string
  }
  stream?: string
  duration: number
  genre?: string
  mood?: string
  playCount: number
  favoriteCount: number
  repostCount: number
  user: AudiusUser
  createdAt: string
}

export interface AudiusPlaylist {
  id: string
  name: string
  description?: string
  artwork?: {
    '150x150': string
    '480x480': string
    '1000x1000': string
  }
  trackCount: number
  repostCount: number
  favoriteCount: number
  totalPlayCount: number
  createdAt: string
  owner: AudiusUser
  tracks: AudiusTrack[]
}

export interface AudiusUser {
  id: string
  handle: string
  name: string
  bio?: string
  profilePicture?: {
    '150x150': string
    '480x480': string
  }
  coverPhoto?: {
    '640x': string
    '2000x': string
  }
  followerCount: number
  followeeCount: number
  trackCount: number
  isVerified: boolean
  wallet: string
}

export interface TapestryProfile {
  id: string
  namespace?: string
  username?: string
  bio?: string | null
  image?: string | null
  customProperties?: Record<string, string>
  created_at?: number
  // Optional extended fields (not always returned by API)
  walletAddress?: string
  followerCount?: number
  followingCount?: number
}

export interface TapestryFollow {
  startId: string
  endId: string
  createdAt: string
}

export interface TapestryLike {
  id: string
  profileId: string
  contentId: string
  createdAt: string
}

export interface TapestryComment {
  id: string
  profileId: string
  contentId: string
  text: string
  createdAt: string
  author?: {
    id: string
    username: string
    image?: string
  }
}

export interface UserRewards {
  totalPoints: number
  rank: number
  activities: RewardActivity[]
}

export interface RewardActivity {
  action: string
  points: number
  timestamp: string
  trackId?: string
  artistId?: string
  [key: string]: unknown
}

export interface ArtistSignal {
  artistId: string
  handle: string
  name: string
  isVerified: boolean
  profilePicture?: {
    '150x150': string
    '480x480': string
  }
  followerCount: number
  trackCount: number
  plays: number
  favorites: number
  reposts: number
  appearanceCount: number
  signalScore: number
  attentionPerFollower: number
}

export interface SignalFeedItem {
  id: string
  createdAt: string
  note: string
  author: {
    id: string
    username: string
    image?: string
  }
  artist: {
    id: string
    name: string
    handle: string
    signalScore: number
    attentionPerFollower: number
  }
}

export type FeedEventType = 'back' | 'comment' | 'follow' | 'like'

export interface FeedEvent {
  id: string
  type: FeedEventType
  createdAt: string
  actorLabel: string
  text?: string
  href?: string
  context?: string
  signalScore?: number
  attentionPerFollower?: number
  isLocal?: boolean
}

export type ActionResult = {
  success: boolean
  data?: unknown
  error?: string
}

export const REWARD_POINTS = {
  CREATE_PROFILE: 100,
  FOLLOW_ARTIST: 10,
  LIKE_TRACK: 5,
  COMMENT: 15,
  BACK_ARTIST: 20,
  STREAM_TRACK: 2,
  DAILY_LOGIN: 20,
  REFER_FRIEND: 500,
  WEEKLY_TOP_LISTENER: 1000,
} as const
