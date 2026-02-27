'use client'

import { useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import { Header } from '@/components/Header'
import { Icon } from '@iconify/react'
import { getActivitiesForWallet, getLeaderboard, getServerLeaderboardSnapshot, subscribeRewards } from '@/lib/rewards'
import { computeSupporterProfile } from '@/lib/reputation'

interface LeaderboardEntry {
  wallet: string
  points: number
  rank: number
}

export default function LeaderboardPage() {
  const entries = useSyncExternalStore<LeaderboardEntry[]>(
    subscribeRewards,
    () => getLeaderboard(20),
    getServerLeaderboardSnapshot
  )
  const enrichedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        supporter: computeSupporterProfile(entry.points, getActivitiesForWallet(entry.wallet)),
      })),
    [entries]
  )

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Icon icon="solar:cup-star-bold-duotone" width="24" className="text-amber-500" />
            <span className="text-sm font-semibold tracking-wide uppercase text-zinc-500">
              Leaderboard
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl tracking-tighter font-display font-light text-zinc-900 mb-6">
            Top Listeners
          </h1>
          <p className="text-lg text-zinc-500 max-w-lg leading-relaxed font-light">
            The most engaged members of our community. Earn points by discovering music, following artists, and more.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-zinc-50 border-b border-zinc-200 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            <div className="col-span-1">Rank</div>
            <div className="col-span-6">Wallet</div>
            <div className="col-span-3">Supporter</div>
            <div className="col-span-2 text-right">Points</div>
          </div>

          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500">
              <Icon icon="solar:users-group-rounded-bold-duotone" width="48" className="text-zinc-300 mb-4 mx-auto" />
              <p>No entries yet. Be the first to earn points!</p>
            </div>
          ) : (
            enrichedEntries.map((entry, index) => (
              <div
                key={entry.wallet}
                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : ''
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {index < 3 ? (
                    <Icon
                      icon={index === 0 ? "solar:crown-bold" : index === 1 ? "solar:medal-ribbon-star-bold" : "solar:medal-ribbon-bold"}
                      width={24}
                      className={index === 0 ? 'text-amber-500' : index === 1 ? 'text-zinc-400' : 'text-amber-700'}
                    />
                  ) : (
                    <span className="text-zinc-400 font-mono">{entry.rank}</span>
                  )}
                </div>
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
                    <Icon icon="solar:user-bold" width="16" className="text-zinc-500" />
                  </div>
                  <code className="text-sm text-zinc-600">
                    {entry.wallet.slice(0, 8)}...{entry.wallet.slice(-8)}
                  </code>
                </div>
                <div className="col-span-3 flex items-center">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 leading-tight">
                      {entry.supporter.score} · {entry.supporter.tier}
                    </p>
                    {entry.supporter.badges[0] && (
                      <p className="text-xs text-zinc-500">{entry.supporter.badges[0].label}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-lg font-semibold text-zinc-900">
                    {entry.points.toLocaleString()}
                  </span>
                  <span className="text-sm text-zinc-400 ml-1">pts</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-6 text-white">
            <Icon icon="solar:heart-bold-duotone" width="32" className="text-rose-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Like Tracks</h3>
            <p className="text-zinc-400 text-sm">5 points per like</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 text-white">
            <Icon icon="solar:user-plus-bold-duotone" width="32" className="text-indigo-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Follow Artists</h3>
            <p className="text-zinc-400 text-sm">10 points per follow</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 text-white">
            <Icon icon="solar:chat-round-dots-bold-duotone" width="32" className="text-amber-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Comment</h3>
            <p className="text-zinc-400 text-sm">15 points per comment</p>
          </div>
        </div>
      </main>
    </>
  )
}
