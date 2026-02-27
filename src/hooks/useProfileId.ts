'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useSyncExternalStore } from 'react'
import {
  getCachedProfileId,
  resolveProfileId,
  subscribeProfileId,
} from '@/lib/tapestryProfile'

export function useProfileId() {
  const { publicKey, connected } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const profileId = useSyncExternalStore(
    subscribeProfileId,
    () => (walletAddress ? getCachedProfileId(walletAddress) : null),
    () => null
  )

  useEffect(() => {
    if (!connected || !walletAddress || profileId) return
    void resolveProfileId(walletAddress)
  }, [connected, walletAddress, profileId])

  return {
    profileId,
    resolving: connected && !profileId,
    walletAddress,
    connected,
  }
}
