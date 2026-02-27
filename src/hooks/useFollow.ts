'use client'

import { useCallback, useEffect, useState } from 'react'
import { followUser, unfollowUser, isFollowing, setLocalFollowState } from '@/lib/tapestry'
import { addPoints } from '@/lib/rewards'
import { useProfileId } from '@/hooks/useProfileId'

interface FollowContext {
  artistFollowerCount?: number
}

export function useFollow(followingId: string | null, context?: FollowContext) {
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const { profileId, walletAddress } = useProfileId()

  useEffect(() => {
    if (!profileId || !followingId) {
      setIsFollowingUser(false)
      return
    }

    const checkFollowStatus = async () => {
      try {
        const following = await isFollowing(profileId, followingId)
        setIsFollowingUser(following)
      } catch (err) {
        console.error('Error checking follow status:', err)
      }
    }

    checkFollowStatus()
  }, [profileId, followingId])

  const toggleFollow = useCallback(async () => {
    if (!profileId || !followingId) return

    setLoading(true)
    try {
      if (isFollowingUser) {
        await unfollowUser(profileId, followingId)
        setLocalFollowState(profileId, followingId, false)
        setIsFollowingUser(false)
      } else {
        await followUser(profileId, followingId)
        setLocalFollowState(profileId, followingId, true)
        setIsFollowingUser(true)
        if (walletAddress) {
          addPoints(walletAddress, 'FOLLOW_ARTIST', {
            artistId: followingId,
            ...(typeof context?.artistFollowerCount === 'number'
              ? { artistFollowerCount: context.artistFollowerCount }
              : {}),
          })
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
    } finally {
      setLoading(false)
    }
  }, [context?.artistFollowerCount, profileId, walletAddress, followingId, isFollowingUser])

  return {
    isFollowing: isFollowingUser,
    loading,
    toggleFollow,
  }
}
