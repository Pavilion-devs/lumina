'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Header } from '@/components/Header'
import { getGlobalFeedEvents } from '@/lib/feed'
import { truncateAddress } from '@/lib/utils'
import { useRewards } from '@/hooks'
import type { FeedEvent, FeedEventType, RewardActivity } from '@/types'

const FILTERS: Array<{ key: 'all' | FeedEventType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'back', label: 'Backs' },
  { key: 'follow', label: 'Follows' },
  { key: 'like', label: 'Likes' },
  { key: 'comment', label: 'Comments' },
]

function toLocalEvents(activities: RewardActivity[], walletAddress?: string): FeedEvent[] {
  const actor = walletAddress ? `You (${truncateAddress(walletAddress)})` : 'You'
  const items: FeedEvent[] = []

  activities.forEach((activity, index) => {
    if (activity.action === 'BACK_ARTIST') {
      items.push({
        id: `local-back-${index}-${activity.timestamp}`,
        type: 'back',
        createdAt: activity.timestamp,
        actorLabel: actor,
        href: typeof activity.artistId === 'string' ? `/artist/${activity.artistId}` : undefined,
        context: typeof activity.artistId === 'string' ? `Artist ${activity.artistId}` : 'Artist signal',
        isLocal: true,
      })
      return
    }

    if (activity.action === 'FOLLOW_ARTIST') {
      items.push({
        id: `local-follow-${index}-${activity.timestamp}`,
        type: 'follow',
        createdAt: activity.timestamp,
        actorLabel: actor,
        href: typeof activity.artistId === 'string' ? `/artist/${activity.artistId}` : undefined,
        context: typeof activity.artistId === 'string' ? `Artist ${activity.artistId}` : 'Artist',
        isLocal: true,
      })
      return
    }

    if (activity.action === 'LIKE_TRACK') {
      items.push({
        id: `local-like-${index}-${activity.timestamp}`,
        type: 'like',
        createdAt: activity.timestamp,
        actorLabel: actor,
        href: typeof activity.trackId === 'string' ? `/track/${activity.trackId}` : undefined,
        context: typeof activity.trackId === 'string' ? `Track ${activity.trackId}` : 'Track',
        isLocal: true,
      })
      return
    }

    if (activity.action === 'COMMENT') {
      items.push({
        id: `local-comment-${index}-${activity.timestamp}`,
        type: 'comment',
        createdAt: activity.timestamp,
        actorLabel: actor,
        href: typeof activity.trackId === 'string' ? `/track/${activity.trackId}` : undefined,
        context: typeof activity.trackId === 'string' ? `Track ${activity.trackId}` : 'Track',
        isLocal: true,
      })
    }
  })

  return items
}

export default function FeedPage() {
  const [globalEvents, setGlobalEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | FeedEventType>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const { recentActivity, walletAddress } = useRewards()

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const data = await getGlobalFeedEvents()
        setGlobalEvents(data)
      } catch (err) {
        console.error('Error loading feed:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [])

  const merged = useMemo(() => {
    const local = toLocalEvents(recentActivity, walletAddress)
    return [...globalEvents, ...local]
  }, [globalEvents, recentActivity, walletAddress])

  const visible = useMemo(() => {
    const byType = filter === 'all' ? merged : merged.filter((item) => item.type === filter)
    const sorted = [...byType].sort((a, b) => {
      const left = new Date(a.createdAt).getTime()
      const right = new Date(b.createdAt).getTime()
      return sortOrder === 'newest' ? right - left : left - right
    })
    return sorted
  }, [merged, filter, sortOrder])

  const actionLabel: Record<FeedEventType, string> = {
    back: 'backed an artist',
    follow: 'followed an artist',
    like: 'liked a track',
    comment: 'commented on a track',
  }

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
            <Icon icon="solar:pulse-bold-duotone" width="18" className="text-zinc-700" />
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Onchain Feed</span>
          </div>
          <h1 className="text-4xl md:text-6xl tracking-tighter font-display font-light text-zinc-900 mb-4">
            Conviction Stream
          </h1>
          <p className="text-zinc-500 text-lg max-w-3xl">
            Combined stream of conviction notes, comments, follows, and likes. Filter event types and sort by time.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setFilter(pill.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
                  filter === pill.key
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-2 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-zinc-200 bg-white p-5 animate-pulse">
                <div className="h-4 w-1/3 bg-zinc-100 rounded-full mb-4" />
                <div className="h-4 w-full bg-zinc-100 rounded-full mb-2" />
                <div className="h-4 w-2/3 bg-zinc-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <Icon icon="solar:document-text-bold-duotone" width="36" className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">No events found for this filter yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((item) => (
              <div key={item.id} className="rounded-3xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] uppercase tracking-wide text-zinc-600">
                        {item.type}
                      </span>
                      {item.isLocal && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] uppercase tracking-wide text-emerald-700">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">
                      <span className="font-medium text-zinc-800">{item.actorLabel}</span> {actionLabel[item.type]}
                    </p>
                    {item.context && (
                      <p className="text-sm text-zinc-700 mt-1">{item.context}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 flex-shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {(item.type === 'back' || item.type === 'comment') && item.text && (
                  <p className="text-zinc-700 leading-relaxed mb-3">{item.text}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {item.signalScore !== undefined && (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600">
                      Signal {item.signalScore.toFixed(1)}
                    </span>
                  )}
                  {item.attentionPerFollower !== undefined && (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600">
                      APF {item.attentionPerFollower.toFixed(1)}
                    </span>
                  )}
                  {item.href && (
                    <Link
                      href={item.href}
                      className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
