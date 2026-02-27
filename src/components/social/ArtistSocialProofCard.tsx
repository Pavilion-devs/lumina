'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Icon } from '@iconify/react'
import { getAllRewardsRecords, subscribeRewards } from '@/lib/rewards'
import { computeArtistCommunitySnapshot, type ArtistCommunityEntry, type ArtistCommunitySnapshot } from '@/lib/reputation'
import { truncateAddress } from '@/lib/utils'

interface ArtistSocialProofCardProps {
  artistId: string
  trackIds: string[]
}

const EMPTY_SNAPSHOT: ArtistCommunitySnapshot = {
  recentFollowers: [],
  recentBackers: [],
  sharedFans: [],
}

function EntryPill({ item }: { item: ArtistCommunityEntry }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-800">{truncateAddress(item.wallet, 5)}</span>
        <span className="text-[11px] text-zinc-500">Score {item.supporterScore}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-[11px] text-zinc-500">
          {item.topBadge ? item.topBadge.label : 'Community supporter'}
        </span>
        {item.timestamp && (
          <span className="text-[11px] text-zinc-400">{new Date(item.timestamp).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  )
}

export function ArtistSocialProofCard({ artistId, trackIds }: ArtistSocialProofCardProps) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const [snapshot, setSnapshot] = useState<ArtistCommunitySnapshot>(EMPTY_SNAPSHOT)

  const trackKey = useMemo(() => trackIds.join('|'), [trackIds])
  const stableTrackIds = useMemo(() => trackKey.split('|').filter(Boolean), [trackKey])

  useEffect(() => {
    const refresh = () => {
      const records = getAllRewardsRecords()
      const next = computeArtistCommunitySnapshot(records, artistId, stableTrackIds, walletAddress)
      setSnapshot(next)
    }

    refresh()
    const unsubscribe = subscribeRewards(refresh)
    return unsubscribe
  }, [artistId, stableTrackIds, walletAddress])

  return (
    <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="solar:users-group-rounded-bold-duotone" width="20" className="text-zinc-700" />
        <h3 className="text-xl tracking-tight font-medium text-zinc-900">Social Proof</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">Recent Followers</p>
          <div className="space-y-2">
            {snapshot.recentFollowers.length === 0 ? (
              <p className="text-sm text-zinc-500">No recent followers captured yet.</p>
            ) : (
              snapshot.recentFollowers.map((entry) => (
                <EntryPill key={`follow-${entry.wallet}`} item={entry} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">Recent Backers</p>
          <div className="space-y-2">
            {snapshot.recentBackers.length === 0 ? (
              <p className="text-sm text-zinc-500">No conviction backers yet.</p>
            ) : (
              snapshot.recentBackers.map((entry) => (
                <EntryPill key={`back-${entry.wallet}`} item={entry} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">Shared Fans With You</p>
          <div className="space-y-2">
            {snapshot.sharedFans.length === 0 ? (
              <p className="text-sm text-zinc-500">Follow/like to surface overlap with other fans.</p>
            ) : (
              snapshot.sharedFans.map((entry) => (
                <EntryPill key={`shared-${entry.wallet}`} item={entry} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
