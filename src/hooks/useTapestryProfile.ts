'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useState } from 'react'
import { createProfile, getProfile, updateProfile } from '@/lib/tapestry'
import { addPoints } from '@/lib/rewards'
import { isGoogleImageSearchUrl, isValidHttpUrl } from '@/lib/utils'
import {
  clearCachedDisplayName,
  findWalletProfileByUsername,
  getCachedDisplayName,
  getCachedProfileId,
  resolveProfileId,
  setCachedDisplayName,
  setCachedProfileId
} from '@/lib/tapestryProfile'
import type { TapestryProfile } from '@/types'

export function useTapestryProfile() {
  const { publicKey, connected } = useWallet()
  const [profile, setProfile] = useState<TapestryProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [relinking, setRelinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  const walletAddress = publicKey?.toBase58()

  useEffect(() => {
    if (!walletAddress || !connected) {
      setProfile(null)
      setDisplayName(null)
      return
    }

    setDisplayName(getCachedDisplayName(walletAddress))

    const fetchProfile = async () => {
      setLoading(true)
      try {
        // First try cached profile ID
        const profileId = getCachedProfileId(walletAddress)
        if (profileId) {
          const existing = await getProfile(profileId)
          if (existing) {
            setProfile(existing)
            return
          }
        }

        // No cache or stale cache: resolve profile id and fetch full profile
        const resolvedId = await resolveProfileId(walletAddress)
        if (resolvedId) {
          const found = await getProfile(resolvedId)
          if (found) {
            setCachedProfileId(walletAddress, found.id)
            setProfile(found)
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [walletAddress, connected])

  const createNewProfile = useCallback(
    async (username: string, bio?: string, image?: string) => {
      if (!walletAddress) {
        setError('Wallet not connected')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const newProfile = await createProfile(walletAddress, username, bio, image)
        setCachedProfileId(walletAddress, newProfile.id)
        setProfile(newProfile)
        addPoints(walletAddress, 'CREATE_PROFILE')
        return newProfile
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create profile')
        return null
      } finally {
        setLoading(false)
      }
    },
    [walletAddress]
  )

  const saveDisplayName = useCallback(
    (name?: string) => {
      if (!walletAddress) return
      const trimmed = name?.trim() ?? ''
      if (!trimmed) {
        clearCachedDisplayName(walletAddress)
        setDisplayName(null)
        return
      }
      setCachedDisplayName(walletAddress, trimmed)
      setDisplayName(trimmed)
    },
    [walletAddress]
  )

  const editProfile = useCallback(
    async (data: { username?: string; bio?: string; image?: string }) => {
      if (!profile?.id) {
        setError('No profile to update')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        let activeProfileId = profile.id
        const requestedUsername = data.username?.trim()

        // Username changes are identity changes in Tapestry, not simple profile metadata edits.
        // If the requested username already exists on this wallet, relink to that profile.
        if (
          requestedUsername &&
          requestedUsername.toLowerCase() !== (profile.username ?? '').trim().toLowerCase() &&
          walletAddress
        ) {
          const match = await findWalletProfileByUsername(walletAddress, requestedUsername)
          if (match?.id) {
            activeProfileId = match.id
            setCachedProfileId(walletAddress, match.id)
          } else {
            setError(
              `Could not switch to "${requestedUsername}". That username is not linked to this wallet profile set.`
            )
            return null
          }
        }

        const currentBio = (profile.bio ?? '').trim()
        const requestedBio = typeof data.bio === 'string' ? data.bio.trim() : undefined
        const bioToWrite = requestedBio !== undefined && requestedBio !== currentBio ? requestedBio : undefined

        const currentImage = (profile.image ?? '').trim()
        const requestedImage = typeof data.image === 'string' ? data.image.trim() : undefined
        const imageChanged = requestedImage !== undefined && requestedImage !== currentImage
        const imageToWrite = imageChanged && requestedImage ? requestedImage : undefined

        if (imageChanged && requestedImage && isGoogleImageSearchUrl(requestedImage)) {
          setError('Use a direct image URL, not a Google search page URL.')
          return null
        }
        if (imageChanged && requestedImage && !isValidHttpUrl(requestedImage)) {
          setError('Profile image must be a valid http(s) URL.')
          return null
        }

        if (bioToWrite === undefined && imageToWrite === undefined) {
          const full = await getProfile(activeProfileId)
          setProfile(full ?? profile)
          return full ?? profile
        }

        const updated = await updateProfile(activeProfileId, {
          ...(bioToWrite !== undefined ? { bio: bioToWrite } : {}),
          ...(imageToWrite !== undefined ? { image: imageToWrite } : {}),
        })
        // Re-fetch full profile to get socialCounts
        const full = await getProfile(activeProfileId)
        setProfile(full ?? updated)
        return full ?? updated
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update profile')
        return null
      } finally {
        setLoading(false)
      }
    },
    [profile, walletAddress]
  )

  const relinkProfile = useCallback(async () => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return null
    }

    setRelinking(true)
    setError(null)
    try {
      const resolvedId = await resolveProfileId(walletAddress)
      if (!resolvedId) {
        setError('Could not resolve profile for this wallet')
        return null
      }

      const resolvedProfile = await getProfile(resolvedId)
      if (!resolvedProfile) {
        setError('Resolved profile could not be loaded')
        return null
      }

      setCachedProfileId(walletAddress, resolvedProfile.id)
      setProfile(resolvedProfile)
      return resolvedProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to relink profile')
      return null
    } finally {
      setRelinking(false)
    }
  }, [walletAddress])

  return {
    profile,
    loading,
    error,
    displayName,
    relinking,
    createNewProfile,
    editProfile,
    saveDisplayName,
    relinkProfile,
    isConnected: connected,
    walletAddress,
  }
}
