'use client'

import { useCallback, useEffect, useState } from 'react'
import { likeContent, unlikeContent, getLikesByContent } from '@/lib/tapestry'
import { addPoints } from '@/lib/rewards'
import { useProfileId } from '@/hooks/useProfileId'
import type { TapestryProfile } from '@/types'

export function useLike(contentId: string | null) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likerProfiles, setLikerProfiles] = useState<TapestryProfile[]>([])
  const [loading, setLoading] = useState(false)
  const { profileId, walletAddress } = useProfileId()

  useEffect(() => {
    if (!contentId) return

    const fetchData = async () => {
      try {
        const { profiles, total } = await getLikesByContent(contentId)
        setLikeCount(total)
        setLikerProfiles(profiles)

        if (profileId) {
          setLiked(profiles.some((p) => p.id === profileId))
        }
      } catch (err) {
        console.error('Error fetching likes:', err)
      }
    }

    fetchData()
  }, [contentId, profileId])

  const toggleLike = useCallback(async () => {
    if (!profileId || !contentId) return

    setLoading(true)
    try {
      if (liked) {
        await unlikeContent(profileId, contentId)
        setLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
      } else {
        await likeContent(profileId, contentId)
        setLiked(true)
        setLikeCount((c) => c + 1)
        if (walletAddress) addPoints(walletAddress, 'LIKE_TRACK', { trackId: contentId })
      }
    } catch (err) {
      console.error('Error toggling like:', err)
    } finally {
      setLoading(false)
    }
  }, [profileId, walletAddress, contentId, liked])

  return {
    liked,
    likeCount,
    likerProfiles,
    loading,
    toggleLike,
  }
}
