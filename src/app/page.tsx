'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { TrackCard, AudioPlayer } from '@/components/audio'
import { Icon } from '@iconify/react'
import { getTrendingTracks, searchTracks } from '@/lib/audius'
import { useRewards } from '@/hooks'
import type { AudiusTrack } from '@/types'

export default function HomePage() {
  const [tracks, setTracks] = useState<AudiusTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTrack, setCurrentTrack] = useState<AudiusTrack | null>(null)
  const { totalPoints, isConnected } = useRewards()

  useEffect(() => {
    loadTrending()
  }, [])

  const loadTrending = async () => {
    try {
      setLoading(true)
      const trending = await getTrendingTracks(20)
      setTracks(trending)
    } catch (err) {
      console.error('Error loading tracks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadTrending()
      return
    }

    try {
      setLoading(true)
      const results = await searchTracks(searchQuery)
      setTracks(results)
    } catch (err) {
      console.error('Error searching tracks:', err)
    } finally {
      setLoading(false)
    }
  }

  const playNext = () => {
    if (!currentTrack) return
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const nextTrack = tracks[currentIndex + 1]
    if (nextTrack) setCurrentTrack(nextTrack)
  }

  const playPrev = () => {
    if (!currentTrack) return
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const prevTrack = tracks[currentIndex - 1]
    if (prevTrack) setCurrentTrack(prevTrack)
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mr-auto ml-auto pt-32 pr-6 pb-12 pl-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <div className="flex items-center gap-2 border border-zinc-200 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur mb-4 md:mb-0 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold tracking-wide uppercase text-zinc-500">
                Powered by Audius + Tapestry
              </span>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h1 className="text-6xl md:text-[7.5rem] leading-[0.9] tracking-tighter font-display font-light text-zinc-900">
            <div className="line-mask">
              <span className="font-display">Discover</span>
            </div>
            <br />
            <div className="line-mask">
              <span className="font-display">The</span>
            </div>
            <div className="line-mask">
              <span className="italic font-serif text-zinc-400">Future</span>
            </div>
            <div className="line-mask">
              <span className="font-display">Of Music.</span>
            </div>
          </h1>
          <div className="mt-8 flex flex-col md:flex-row justify-between items-start gap-8">
            <p className="text-lg md:text-xl text-zinc-500 max-w-lg leading-relaxed font-light">
              Connect your wallet, discover trending tracks, and earn rewards for every interaction. 
              Your social graph, fully onchain.
            </p>
            <div className="flex gap-4">
              <button className="w-14 h-14 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors group">
                <Icon icon="solar:arrow-right-down-bold-duotone" width="24" className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-full aspect-[16/10] md:aspect-[2.4/1] rounded-3xl overflow-hidden mb-24 group shadow-xl shadow-zinc-200/50">
          <div className="absolute inset-0 z-10 bg-zinc-900/20 transition-colors duration-700 group-hover:bg-zinc-900/0"></div>
          <Image
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop"
            alt="Music Experience"
            fill
            className="object-cover grayscale opacity-95 transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
            priority
          />
          <div className="absolute bottom-8 left-8 z-20">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <Icon icon="solar:music-note-bold" width="16" />
              <span className="text-xs font-medium tracking-tight uppercase">
                Built on Solana
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden border-y bg-white/50 w-full border-zinc-200 mb-32 pt-10 pb-10 backdrop-blur">
          <div className="flex animate-marquee w-max gap-20 items-center">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex gap-20 items-center">
                <Icon icon="simple-icons:solana" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:spotify" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:apple" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:soundcloud" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:youtube" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:soundcharts" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:tidal" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
                <Icon icon="simple-icons:deezer" width="64" height="64" className="text-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer duration-500" />
              </div>
            ))}
          </div>
        </div>

        {isConnected && totalPoints > 0 && (
          <div className="mb-8 p-6 bg-zinc-900 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-sm text-zinc-400 uppercase tracking-wide">Your Rewards</p>
                <p className="text-3xl font-bold text-white mt-1">{totalPoints.toLocaleString()} points</p>
              </div>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 rounded-full text-sm font-medium hover:bg-zinc-100 transition-colors"
              >
                View Leaderboard
                <Icon icon="solar:arrow-right-linear" width="16" />
              </Link>
            </div>
          </div>
        )}

        <section className="mb-32">
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-4xl md:text-5xl tracking-tighter font-display font-light">
              Trending Tracks
            </h2>
            <div className="hidden md:flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks..."
                  className="bg-zinc-100 border border-zinc-200 rounded-full px-4 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-zinc-100 rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No tracks found. Try a different search.
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

        <div className="flex flex-col items-center text-center mb-32 pt-16">
          <Icon icon="solar:wallet-bold-duotone" width="64" className="text-zinc-900 mb-6" />
          <h2 className="text-5xl md:text-7xl tracking-tighter font-display font-light mb-8 text-zinc-900">
            Ready to join?
          </h2>
          <p className="text-lg text-zinc-500 max-w-md mb-8">
            Connect your wallet to start earning rewards for every track you discover.
          </p>
          <Link
            href="/profile"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-zinc-900 rounded-full overflow-hidden transition-all hover:bg-zinc-800 hover:scale-105"
          >
            <span className="relative flex items-center gap-3">
              Get Started
              <Icon icon="solar:arrow-right-linear" width="20" />
            </span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-50 relative">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Icon icon="solar:music-notes-bold-duotone" width="24" className="text-zinc-400" />
              <span className="text-lg tracking-tighter font-semibold font-display uppercase text-zinc-400">
                Lumina
              </span>
            </div>

            <div className="flex gap-8 text-sm font-medium text-zinc-500">
              <a href="https://audius.org" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
                Audius
              </a>
              <a href="https://usetapestry.dev" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">
                Tapestry
              </a>
            </div>

            <div className="text-sm text-zinc-400">
              Built for Solana Colosseum
            </div>
          </div>
        </div>
      </footer>

      <AudioPlayer 
        track={currentTrack} 
        onNext={playNext}
        onPrev={playPrev}
      />
    </>
  )
}
