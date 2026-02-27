'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { formatNumber, formatDuration } from '@/lib/utils'
import type { AudiusTrack } from '@/types'

interface TrackCardProps {
  track: AudiusTrack
  onPlay?: (track: AudiusTrack) => void
}

export function TrackCard({ track, onPlay }: TrackCardProps) {
  const artworkUrl = track.artwork?.['480x480'] || '/placeholder-album.png'

  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-2xl mb-4 aspect-square bg-zinc-100">
        {track.artwork ? (
          <Image
            src={artworkUrl}
            alt={track.title}
            fill
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
            <Icon icon="solar:music-note-bold-duotone" width="48" className="text-zinc-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500"></div>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onPlay?.(track)
          }}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-105 transform"
        >
          <Icon icon="solar:play-bold" width="20" className="text-zinc-900 ml-0.5" />
        </button>

        <div className="absolute bottom-4 left-4 flex gap-2">
          {track.genre && (
            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              {track.genre}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <Link href={`/track/${track.id}`}>
            <h4 className="text-lg tracking-tight mb-1 font-display font-medium truncate hover:text-zinc-600 transition-colors">
              {track.title}
            </h4>
          </Link>
          <Link href={`/artist/${track.user.id}`}>
            <p className="text-zinc-500 text-sm truncate hover:text-zinc-900 transition-colors">
              {track.user.name}
            </p>
          </Link>
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
            <span>{formatDuration(track.duration)}</span>
            <span>{formatNumber(track.playCount)} plays</span>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all flex-shrink-0">
          <Icon icon="solar:arrow-right-up-linear" width="18" />
        </button>
      </div>
    </div>
  )
}
