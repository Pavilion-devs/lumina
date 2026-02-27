'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Header } from '@/components/Header'
import { getUndervaluedArtistSignals } from '@/lib/signals'
import { formatNumber } from '@/lib/utils'
import type { ArtistSignal } from '@/types'

export default function SignalsPage() {
  const [signals, setSignals] = useState<ArtistSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSignals = async () => {
      try {
        const data = await getUndervaluedArtistSignals(24)
        setSignals(data)
      } catch (err) {
        console.error('Error loading artist signals:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSignals()
  }, [])

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
            <Icon icon="solar:graph-up-bold-duotone" width="18" className="text-zinc-700" />
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Signals</span>
          </div>
          <h1 className="text-4xl md:text-6xl tracking-tighter font-display font-light text-zinc-900 mb-4">
            Undervalued Artist Radar
          </h1>
          <p className="text-zinc-500 text-lg max-w-3xl">
            A daily-style ranking of artists whose engagement momentum looks strong relative to their current audience size.
            Use this to discover talent early and back your conviction onchain.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-zinc-200 bg-white p-6 animate-pulse">
                <div className="h-6 bg-zinc-100 rounded-full w-2/3 mb-5" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-16 bg-zinc-100 rounded-2xl" />
                  <div className="h-16 bg-zinc-100 rounded-2xl" />
                </div>
                <div className="h-4 bg-zinc-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((artist, idx) => (
              <Link
                key={artist.artistId}
                href={`/artist/${artist.artistId}`}
                className="group rounded-3xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-100 ring-1 ring-zinc-200 flex-shrink-0">
                      {artist.profilePicture ? (
                        <Image
                          src={artist.profilePicture['150x150']}
                          alt={artist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon icon="solar:user-bold-duotone" width="22" className="text-zinc-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900 truncate">{artist.name}</p>
                        {artist.isVerified && (
                          <Icon icon="solar:verified-check-bold" width="16" className="text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">@{artist.handle}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Rank</p>
                    <p className="text-xl font-semibold text-zinc-900">#{idx + 1}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Signal Score</p>
                    <p className="text-xl font-semibold text-zinc-900">{artist.signalScore.toFixed(1)}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">APF</p>
                    <p className="text-xl font-semibold text-zinc-900">{artist.attentionPerFollower.toFixed(1)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
                  <div>
                    <p className="uppercase tracking-wide">Followers</p>
                    <p className="text-zinc-800 font-medium mt-1">{formatNumber(artist.followerCount)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide">Tracks</p>
                    <p className="text-zinc-800 font-medium mt-1">{formatNumber(artist.trackCount)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide">Momentum</p>
                    <p className="text-zinc-800 font-medium mt-1">{formatNumber(artist.appearanceCount)}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-zinc-600">View artist and back thesis</span>
                  <Icon icon="solar:arrow-right-up-linear" width="18" className="text-zinc-500 group-hover:text-zinc-900" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
