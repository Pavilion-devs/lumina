'use client'

import { useCallback, useEffect, useState } from 'react'
import { createArtistSignal, getArtistSignals } from '@/lib/tapestry'
import { addPoints } from '@/lib/rewards'
import { useProfileId } from '@/hooks/useProfileId'
import type { TapestryComment } from '@/types'

export function useArtistSignals(artistId: string | null) {
  const [signals, setSignals] = useState<TapestryComment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { profileId, resolving, walletAddress } = useProfileId()

  const reload = useCallback(async () => {
    if (!artistId) return

    setLoading(true)
    try {
      const data = await getArtistSignals(artistId, 20, 0)
      setSignals(data)
    } catch (err) {
      console.error('Error loading artist signals:', err)
    } finally {
      setLoading(false)
    }
  }, [artistId])

  useEffect(() => {
    reload()
  }, [reload])

  const submitSignal = useCallback(async (text: string) => {
    if (!profileId || !artistId || !text.trim()) return false

    setSubmitting(true)
    try {
      const note = await createArtistSignal(profileId, artistId, text.trim())
      setSignals((prev) => [note, ...prev])
      if (walletAddress) {
        addPoints(walletAddress, 'BACK_ARTIST', {
          artistId,
          noteLength: text.trim().length,
        })
      }
      return true
    } catch (err) {
      console.error('Error creating artist signal:', err)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [profileId, artistId, walletAddress])

  return {
    signals,
    loading,
    submitting,
    resolvingProfile: resolving,
    canPost: Boolean(profileId),
    submitSignal,
    reload,
  }
}
