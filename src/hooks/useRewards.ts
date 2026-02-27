'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useSyncExternalStore } from 'react'
import { getRewardsSnapshot, getServerRewardsSnapshot, subscribeRewards } from '@/lib/rewards'

export function useRewards() {
  const { publicKey, connected } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const snapshot = useSyncExternalStore(
    subscribeRewards,
    () => getRewardsSnapshot(walletAddress, 10),
    getServerRewardsSnapshot
  )

  return {
    totalPoints: snapshot.totalPoints,
    recentActivity: snapshot.recentActivity,
    isConnected: connected,
    walletAddress,
  }
}
