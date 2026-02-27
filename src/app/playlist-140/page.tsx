'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Header } from '@/components/Header'
import { AudioPlayer, TrackCard } from '@/components/audio'
import { getPlaylist, getPlaylistArtworkUrl, getProfilePictureUrl } from '@/lib/audius'
import { formatNumber } from '@/lib/utils'
import type { AudiusPlaylist, AudiusTrack } from '@/types'

const PLAYLIST_ID = 'l5Q60YO'

export default function Playlist140Page() {
  const [playlist, setPlaylist] = useState<AudiusPlaylist | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudiusTrack | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getPlaylist(PLAYLIST_ID)
        setPlaylist(data)
      } catch (err) {
        console.error('Error loading playlist:', err)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const playNext = () => {
    if (!currentTrack || !playlist) return
    const index = playlist.tracks.findIndex((track) => track.id === currentTrack.id)
    const next = playlist.tracks[index + 1]
    if (next) setCurrentTrack(next)
  }

  const playPrev = () => {
    if (!currentTrack || !playlist) return
    const index = playlist.tracks.findIndex((track) => track.id === currentTrack.id)
    const prev = playlist.tracks[index - 1]
    if (prev) setCurrentTrack(prev)
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-64 bg-zinc-200 rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="aspect-square rounded-3xl bg-zinc-200" />
              <div className="md:col-span-2 space-y-3">
                <div className="h-8 w-80 bg-zinc-200 rounded-full" />
                <div className="h-5 w-2/3 bg-zinc-200 rounded-full" />
                <div className="h-4 w-full bg-zinc-200 rounded-full" />
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!playlist) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
          <Icon icon="solar:music-note-bold-duotone" width="56" className="text-zinc-300 mx-auto mb-4" />
          <h1 className="text-3xl tracking-tight font-display mb-3">Playlist Not Available</h1>
          <p className="text-zinc-500 mb-6">Could not load Audius playlist 140 right now.</p>
          <Link href="/discover" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white text-sm">
            <Icon icon="solar:arrow-left-linear" width="16" />
            Back to Discover
          </Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
          <Icon icon="solar:music-library-2-bold-duotone" width="16" className="text-zinc-700" />
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Audius Playlist Showcase</span>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="relative aspect-square rounded-3xl overflow-hidden ring-1 ring-zinc-200 bg-zinc-100">
            <Image
              src={getPlaylistArtworkUrl(playlist, '1000x1000')}
              alt={playlist.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-6xl tracking-tighter font-display font-light text-zinc-900 mb-4">
              {playlist.name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200">
                <Image
                  src={getProfilePictureUrl(playlist.owner, '150x150')}
                  alt={playlist.owner.name}
                  fill
                  className="object-cover"
                />
              </div>
              <Link href={`/artist/${playlist.owner.id}`} className="text-zinc-700 hover:text-zinc-900">
                Curated by <span className="font-medium">{playlist.owner.name}</span>
              </Link>
            </div>

            {playlist.description && (
              <p className="text-zinc-600 leading-relaxed max-w-3xl mb-6 whitespace-pre-line">
                {playlist.description}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-2xl font-semibold text-zinc-900">{formatNumber(playlist.trackCount)}</p>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Tracks</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-2xl font-semibold text-zinc-900">{formatNumber(playlist.totalPlayCount)}</p>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Total Plays</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-2xl font-semibold text-zinc-900">{formatNumber(playlist.favoriteCount)}</p>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Favorites</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-2xl font-semibold text-zinc-900">{formatNumber(playlist.repostCount)}</p>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Reposts</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-7">
            <h2 className="text-3xl md:text-4xl tracking-tighter font-display font-light text-zinc-900">
              Tracks
            </h2>
            <a
              href={`https://audius.co/Audius/playlist/140`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:border-zinc-400"
            >
              Open on Audius
              <Icon icon="solar:arrow-right-up-linear" width="16" />
            </a>
          </div>

          {playlist.tracks.length === 0 ? (
            <p className="text-zinc-500">No tracks in this playlist.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {playlist.tracks.map((track) => (
                <TrackCard key={track.id} track={track} onPlay={setCurrentTrack} />
              ))}
            </div>
          )}
        </section>
      </main>

      <AudioPlayer track={currentTrack} onNext={playNext} onPrev={playPrev} />
    </>
  )
}

