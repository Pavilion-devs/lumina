'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { formatDuration } from '@/lib/utils'
import type { AudiusTrack } from '@/types'

interface AudioPlayerProps {
  track: AudiusTrack | null
  onNext?: () => void
  onPrev?: () => void
}

function AudioPlayerSession({ track, onNext, onPrev }: { track: AudiusTrack; onNext?: () => void; onPrev?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track.stream) return

    let cancelled = false

    audio.pause()
    audio.src = track.stream
    audio.currentTime = 0

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (!cancelled) setIsPlaying(true)
        })
        .catch((err: Error) => {
          if (!cancelled && err.name !== 'AbortError') {
            console.error('Play failed:', err)
          }
        })
    }

    return () => {
      cancelled = true
    }
  }, [track])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onNext}
        />

        <div className="flex items-center gap-3 flex-shrink-0 w-64">
          <div className="w-12 h-12 relative rounded-lg overflow-hidden">
            {track.artwork ? (
              <Image
                src={track.artwork['150x150']}
                alt={track.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <Icon icon="solar:music-note-bold" width="20" className="text-zinc-600" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{track.title}</p>
            <p className="text-zinc-400 text-xs truncate">{track.user.name}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button onClick={onPrev} className="text-zinc-400 hover:text-white transition-colors">
              <Icon icon="solar:skip-previous-bold" width="24" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Icon icon="solar:pause-bold" width="18" className="text-zinc-900" />
              ) : (
                <Icon icon="solar:play-bold" width="18" className="text-zinc-900 ml-0.5" />
              )}
            </button>
            <button onClick={onNext} className="text-zinc-400 hover:text-white transition-colors">
              <Icon icon="solar:skip-next-bold" width="24" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-zinc-400 w-10 text-right font-mono">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <span className="text-xs text-zinc-400 w-10 font-mono">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-32 justify-end">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted ? (
              <Icon icon="solar:volume-cross-bold" width="20" />
            ) : (
              <Icon icon="solar:volume-loud-bold" width="20" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  )
}

export function AudioPlayer({ track, onNext, onPrev }: AudioPlayerProps) {
  if (!track) return null

  return <AudioPlayerSession key={track.id} track={track} onNext={onNext} onPrev={onPrev} />
}
