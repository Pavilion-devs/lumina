'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Icon } from '@iconify/react'
import {
  getTrendingTracks,
  searchUsers,
  getProfilePictureUrl,
} from '@/lib/audius'
import { formatNumber } from '@/lib/utils'
import type { AudiusTrack, AudiusUser } from '@/types'

const SEARCH_PAGE_SIZE = 20
const TRENDING_TRACK_BATCH = 80

type DiscoverMode = 'trending' | 'search'
type SortMode = 'default' | 'followers_desc' | 'tracks_desc' | 'name_asc'
type MinFollowers = 'all' | '1k' | '10k'

function uniqueArtistsFromTracks(tracks: AudiusTrack[]): AudiusUser[] {
  const seen = new Set<string>()
  const artists: AudiusUser[] = []

  for (const track of tracks) {
    if (seen.has(track.user.id)) continue
    seen.add(track.user.id)
    artists.push(track.user)
  }

  return artists
}

function mergeUniqueArtists(current: AudiusUser[], incoming: AudiusUser[]): AudiusUser[] {
  const seen = new Set(current.map((a) => a.id))
  const merged = [...current]

  for (const artist of incoming) {
    if (!seen.has(artist.id)) {
      merged.push(artist)
      seen.add(artist.id)
    }
  }

  return merged
}

export default function DiscoverPage() {
  const [artists, setArtists] = useState<AudiusUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [mode, setMode] = useState<DiscoverMode>('trending')

  const [trackOffset, setTrackOffset] = useState(0)
  const [searchOffset, setSearchOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minFollowers, setMinFollowers] = useState<MinFollowers>('all')
  const [sortMode, setSortMode] = useState<SortMode>('default')

  useEffect(() => {
    void loadTrendingInitial()
  }, [])

  const loadTrendingInitial = async () => {
    try {
      setLoading(true)
      const tracks = await getTrendingTracks(TRENDING_TRACK_BATCH, 0)
      const firstArtists = uniqueArtistsFromTracks(tracks)
      setArtists(firstArtists)
      setMode('trending')
      setTrackOffset(TRENDING_TRACK_BATCH)
      setHasMore(tracks.length > 0)
      setActiveQuery('')
    } catch (err) {
      console.error('Error loading artists:', err)
    } finally {
      setLoading(false)
    }
  }

  const runSearch = async (query: string) => {
    try {
      setLoading(true)
      const results = await searchUsers(query, SEARCH_PAGE_SIZE, 0)
      setArtists(results)
      setMode('search')
      setActiveQuery(query)
      setSearchOffset(SEARCH_PAGE_SIZE)
      setHasMore(results.length === SEARCH_PAGE_SIZE)
    } catch (err) {
      console.error('Error searching artists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()

    if (!query) {
      await loadTrendingInitial()
      return
    }

    await runSearch(query)
  }

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return

    try {
      setLoadingMore(true)

      if (mode === 'search' && activeQuery) {
        const more = await searchUsers(activeQuery, SEARCH_PAGE_SIZE, searchOffset)
        setArtists((prev) => mergeUniqueArtists(prev, more))
        setSearchOffset((prev) => prev + SEARCH_PAGE_SIZE)
        setHasMore(more.length === SEARCH_PAGE_SIZE)
        return
      }

      const tracks = await getTrendingTracks(TRENDING_TRACK_BATCH, trackOffset)
      const moreArtists = uniqueArtistsFromTracks(tracks)
      setArtists((prev) => mergeUniqueArtists(prev, moreArtists))
      setTrackOffset((prev) => prev + TRENDING_TRACK_BATCH)
      setHasMore(tracks.length > 0)
    } catch (err) {
      console.error('Error loading more artists:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredArtists = useMemo(() => {
    let next = [...artists]

    if (verifiedOnly) {
      next = next.filter((artist) => artist.isVerified)
    }

    if (minFollowers === '1k') {
      next = next.filter((artist) => artist.followerCount >= 1000)
    } else if (minFollowers === '10k') {
      next = next.filter((artist) => artist.followerCount >= 10000)
    }

    if (sortMode === 'followers_desc') {
      next.sort((a, b) => b.followerCount - a.followerCount)
    } else if (sortMode === 'tracks_desc') {
      next.sort((a, b) => b.trackCount - a.trackCount)
    } else if (sortMode === 'name_asc') {
      next.sort((a, b) => a.name.localeCompare(b.name))
    }

    return next
  }, [artists, verifiedOnly, minFollowers, sortMode])

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl tracking-tighter font-display font-light text-zinc-900 mb-4">
            Discover Artists
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl">
            Explore artists on Audius, filter by profile quality, and load more as you browse.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-lg">
            <Icon
              icon="solar:magnifer-linear"
              width="20"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-100 rounded-full text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  void loadTrendingInitial()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
              >
                <Icon icon="solar:close-circle-bold" width="20" />
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
                verifiedOnly
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              Verified Only
            </button>

            <select
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value as MinFollowers)}
              className="px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold uppercase tracking-wide text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="all">All Followers</option>
              <option value="1k">1K+ Followers</option>
              <option value="10k">10K+ Followers</option>
            </select>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold uppercase tracking-wide text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="default">Default Order</option>
              <option value="followers_desc">Most Followers</option>
              <option value="tracks_desc">Most Tracks</option>
              <option value="name_asc">Name A-Z</option>
            </select>
          </div>

          <div className="text-xs uppercase tracking-wide text-zinc-500">
            {mode === 'search' && activeQuery
              ? `Search: "${activeQuery}"`
              : 'Trending discovery'} · {filteredArtists.length} shown
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-zinc-200 rounded-2xl mb-3" />
                <div className="h-4 bg-zinc-200 rounded-full w-3/4 mb-2" />
                <div className="h-3 bg-zinc-200 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="text-center py-24">
            <Icon icon="solar:user-bold-duotone" width="48" className="text-zinc-300 mb-4 mx-auto" />
            <p className="text-zinc-500">No artists found for the current query/filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 mb-3 ring-1 ring-zinc-200 transition-all group-hover:ring-zinc-400 group-hover:shadow-lg">
                    {artist.profilePicture ? (
                      <Image
                        src={getProfilePictureUrl(artist, '480x480')}
                        alt={artist.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon icon="solar:user-bold-duotone" width="48" className="text-zinc-300" />
                      </div>
                    )}
                    {artist.isVerified && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1">
                        <Icon icon="solar:verified-check-bold" width="18" className="text-blue-500" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-zinc-900 truncate group-hover:text-zinc-600 transition-colors">
                    {artist.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span>{formatNumber(artist.followerCount)} followers</span>
                    <span>{formatNumber(artist.trackCount)} tracks</span>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Icon icon="solar:refresh-bold" width="16" />
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
