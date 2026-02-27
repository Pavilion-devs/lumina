'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { AudioPlayer } from '@/components/audio'
import { CommentSection } from '@/components/social'
import { Icon } from '@iconify/react'
import { getTrack, getArtworkUrl } from '@/lib/audius'
import { useLike } from '@/hooks'
import { formatNumber, formatDuration, cn } from '@/lib/utils'
import type { AudiusTrack } from '@/types'

export default function TrackPage() {
  const params = useParams()
  const trackId = params.id as string

  const [track, setTrack] = useState<AudiusTrack | null>(null)
  const [loading, setLoading] = useState(true)
  const { liked, likeCount, likerProfiles, loading: likeLoading, toggleLike } = useLike(trackId)

  useEffect(() => {
    const loadTrack = async () => {
      try {
        const data = await getTrack(trackId)
        setTrack(data)
      } catch (err) {
        console.error('Error loading track:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTrack()
  }, [trackId])

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-12">
          <div className="animate-pulse space-y-4">
            <div className="w-full aspect-video bg-zinc-200 rounded-3xl" />
          </div>
        </div>
      </>
    )
  }

  if (!track) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-12 text-center">
          <Icon icon="solar:music-note-bold-duotone" width="64" className="text-zinc-300 mb-6 mx-auto" />
          <p className="text-xl text-zinc-500 mb-4">Track not found</p>
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
      
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="flex flex-col md:flex-row gap-8 mb-16">
          <div className="w-full md:w-1/2">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-zinc-200/50 group">
              {track.artwork ? (
                <Image
                  src={getArtworkUrl(track, '1000x1000')}
                  alt={track.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                  <Icon icon="solar:music-note-bold-duotone" width="64" className="text-zinc-400" />
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl tracking-tighter font-display font-light text-zinc-900 mb-2">
                {track.title}
              </h1>
              <Link 
                href={`/artist/${track.user.id}`}
                className="text-lg text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {track.user.name}
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {track.genre && (
                <span className="px-4 py-2 bg-zinc-100 rounded-full text-sm font-medium text-zinc-600">
                  {track.genre}
                </span>
              )}
              {track.mood && (
                <span className="px-4 py-2 bg-zinc-100 rounded-full text-sm font-medium text-zinc-600">
                  {track.mood}
                </span>
              )}
              <span className="px-4 py-2 bg-zinc-100 rounded-full text-sm font-medium text-zinc-600">
                {formatDuration(track.duration)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-2xl font-bold text-zinc-900">{formatNumber(track.playCount)}</p>
                <p className="text-sm text-zinc-500">Plays</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-2xl font-bold text-zinc-900">{formatNumber(track.favoriteCount + likeCount)}</p>
                <p className="text-sm text-zinc-500">Likes</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-2xl font-bold text-zinc-900">{formatNumber(track.repostCount)}</p>
                <p className="text-sm text-zinc-500">Reposts</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
                disabled={likeLoading}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full border transition-all',
                  liked
                    ? 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100'
                    : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                <Icon icon={liked ? "solar:heart-bold" : "solar:heart-linear"} width={24} />
              </button>
              {track.stream && (
                <a
                  href={track.stream}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-full font-medium text-white transition-colors"
                >
                  <Icon icon="solar:play-bold" width="18" />
                  Play
                </a>
              )}
            </div>

            {likerProfiles.length > 0 && (
              <div className="pt-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Recent Likers</p>
                <div className="flex flex-wrap gap-2">
                  {likerProfiles.slice(0, 6).map((profile) => (
                    <span
                      key={profile.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700"
                    >
                      <Icon icon="solar:user-bold" width={12} className="text-zinc-500" />
                      {profile.username ?? profile.id.slice(0, 6)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {track.description && (
          <div className="mb-12">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Description</h3>
            <p className="text-zinc-600 leading-relaxed">{track.description}</p>
          </div>
        )}

        <div className="border-t border-zinc-200 pt-12">
          <CommentSection contentId={track.id} />
        </div>
      </main>

      <AudioPlayer track={track} />
    </>
  )
}
