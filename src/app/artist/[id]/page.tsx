'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { TrackCard, AudioPlayer } from '@/components/audio'
import { FollowButton, ArtistBackingCard } from '@/components/social'
import { useFollow } from '@/hooks'
import { Icon } from '@iconify/react'
import { getUser, getUserTracks, getProfilePictureUrl } from '@/lib/audius'
import { formatNumber } from '@/lib/utils'
import type { AudiusUser, AudiusTrack } from '@/types'

export default function ArtistPage() {
  const params = useParams()
  const artistId = params.id as string

  const [artist, setArtist] = useState<AudiusUser | null>(null)
  const [tracks, setTracks] = useState<AudiusTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudiusTrack | null>(null)
  const { isFollowing, loading: followLoading, toggleFollow } = useFollow(artistId)

  useEffect(() => {
    const loadArtist = async () => {
      try {
        const [userData, tracksData] = await Promise.all([
          getUser(artistId),
          getUserTracks(artistId, 20),
        ])
        setArtist(userData)
        setTracks(tracksData)
      } catch (err) {
        console.error('Error loading artist:', err)
      } finally {
        setLoading(false)
      }
    }

    loadArtist()
  }, [artistId])

  const playNext = () => {
    if (!currentTrack) return
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const next = tracks[currentIndex + 1]
    if (next) setCurrentTrack(next)
  }

  const playPrev = () => {
    if (!currentTrack) return
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const prev = tracks[currentIndex - 1]
    if (prev) setCurrentTrack(prev)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-12">
          <div className="animate-pulse space-y-8">
            <div className="flex gap-8 items-center">
              <div className="w-32 h-32 rounded-full bg-zinc-200" />
              <div className="space-y-3">
                <div className="h-8 w-48 bg-zinc-200 rounded-full" />
                <div className="h-4 w-32 bg-zinc-200 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-zinc-100 rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!artist) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-12 text-center">
          <Icon icon="solar:user-bold-duotone" width="64" className="text-zinc-300 mb-6 mx-auto" />
          <p className="text-xl text-zinc-500 mb-4">Artist not found</p>
          <Link href="/" className="text-zinc-900 hover:underline">
            Back to home
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-16">
          <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden ring-4 ring-zinc-100 shadow-xl shadow-zinc-200/50 flex-shrink-0">
            {artist.profilePicture ? (
              <Image
                src={getProfilePictureUrl(artist, '480x480')}
                alt={artist.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                <Icon icon="solar:user-bold-duotone" width="64" className="text-zinc-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-6xl tracking-tighter font-display font-light text-zinc-900 truncate">
                {artist.name}
              </h1>
              {artist.isVerified && (
                <Icon icon="solar:verified-check-bold" width="28" className="text-blue-500 flex-shrink-0" />
              )}
            </div>

            <p className="text-zinc-500 mb-4">@{artist.handle}</p>

            <div className="flex flex-wrap gap-6 mb-6 text-sm text-zinc-500">
              <div>
                <span className="font-semibold text-zinc-900 text-lg">{formatNumber(artist.followerCount + (isFollowing ? 1 : 0))}</span>
                {' '}followers
              </div>
              <div>
                <span className="font-semibold text-zinc-900 text-lg">{formatNumber(artist.followeeCount)}</span>
                {' '}following
              </div>
              <div>
                <span className="font-semibold text-zinc-900 text-lg">{formatNumber(artist.trackCount)}</span>
                {' '}tracks
              </div>
            </div>

            {artist.bio && (
              <p className="text-zinc-600 max-w-xl leading-relaxed mb-6">{artist.bio}</p>
            )}

            <FollowButton
              isFollowing={isFollowing}
              loading={followLoading}
              onToggle={toggleFollow}
              size="lg"
            />

            <ArtistBackingCard artistId={artistId} artistName={artist.name} />
          </div>
        </div>

        {/* Tracks */}
        <section>
          <h2 className="text-3xl md:text-4xl tracking-tighter font-display font-light mb-8">
            Tracks
          </h2>

          {tracks.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No tracks available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={setCurrentTrack}
                />
              ))}
            </div>
          )}
        </section>

        {/* Back link */}
        <div className="mt-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm"
          >
            <Icon icon="solar:arrow-left-linear" width="16" />
            Back to Discover
          </Link>
        </div>
      </main>

      <AudioPlayer
        track={currentTrack}
        onNext={playNext}
        onPrev={playPrev}
      />
    </>
  )
}
