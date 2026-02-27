'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from '@/components/Header'
import { Icon } from '@iconify/react'
import { useTapestryProfile, useRewards } from '@/hooks'
import { useState } from 'react'

export default function ProfilePage() {
  const { connected } = useWallet()
  const {
    profile,
    loading,
    error,
    displayName,
    relinking,
    createNewProfile,
    editProfile,
    saveDisplayName,
    relinkProfile,
  } = useTapestryProfile()
  const { totalPoints, recentActivity } = useRewards()

  // Create form state
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit mode state
  const [editing, setEditing] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editLinkedHandle, setEditLinkedHandle] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editImage, setEditImage] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateProfile = async () => {
    if (!username.trim()) return
    setCreating(true)
    await createNewProfile(username, bio, imageUrl || undefined)
    setCreating(false)
  }

  const handleStartEdit = () => {
    setEditDisplayName(displayName ?? profile?.username ?? '')
    setEditLinkedHandle(profile?.username ?? '')
    setEditBio(profile?.bio ?? '')
    setEditImage(profile?.image ?? '')
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    saveDisplayName(editDisplayName)

    const currentHandle = (profile?.username ?? '').trim().toLowerCase()
    const requestedHandle = editLinkedHandle.trim()
    const usernameToSwitch =
      requestedHandle && requestedHandle.toLowerCase() !== currentHandle
        ? requestedHandle
        : undefined

    const updated = await editProfile({
      username: usernameToSwitch,
      bio: editBio,
      image: editImage
    })
    if (updated) setEditing(false)
    setSaving(false)
  }

  if (!connected) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Icon icon="solar:wallet-bold-duotone" width="64" className="text-zinc-300 mb-6" />
            <h1 className="text-4xl tracking-tighter font-display font-light text-zinc-900 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-lg text-zinc-500 max-w-md">
              Connect your Solana wallet to view your profile and start earning rewards.
            </p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl tracking-tighter font-display font-light text-zinc-900 mb-6">
            Your Profile
          </h1>
        </div>

        {/* Create Profile Form */}
        {!profile && !loading && (
          <div className="max-w-md bg-white rounded-2xl border border-zinc-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Icon icon="solar:user-plus-bold-duotone" width="32" className="text-indigo-500" />
              <h2 className="text-xl font-medium">Create Your Profile</h2>
            </div>
            <p className="text-zinc-500 mb-6">
              Set up your onchain profile to start earning rewards and connecting with artists.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Profile Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <button
                onClick={handleCreateProfile}
                disabled={creating || !username.trim()}
                className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Profile Display */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column — Profile Card */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                    {profile.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.image}
                        alt={displayName ?? profile.username ?? ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon icon="solar:user-bold" width="32" className="text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-medium truncate">{displayName ?? profile.username ?? 'Anonymous'}</h2>
                    {displayName && profile.username && displayName.trim() !== profile.username.trim() && (
                      <p className="text-xs text-zinc-400 truncate">@{profile.username}</p>
                    )}
                    {profile.walletAddress && (
                      <p className="text-xs text-zinc-400 font-mono truncate">
                        {profile.walletAddress.slice(0, 4)}...{profile.walletAddress.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-zinc-600 text-sm mb-4">{profile.bio}</p>
                )}

                {/* Followers / Following */}
                <div className="flex gap-6 mb-6 text-sm">
                  <div>
                    <span className="font-semibold text-zinc-900">{profile.followerCount ?? 0}</span>
                    <span className="text-zinc-500 ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-900">{profile.followingCount ?? 0}</span>
                    <span className="text-zinc-500 ml-1">following</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-zinc-500">Total Points</span>
                    <span className="text-2xl font-bold">{totalPoints.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleStartEdit}
                  className="w-full py-2.5 border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:pen-bold" width="16" />
                  Edit Profile
                </button>

                <button
                  onClick={relinkProfile}
                  disabled={relinking}
                  className="w-full mt-2 py-2.5 border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Icon icon="solar:refresh-bold" width="16" />
                  {relinking ? 'Relinking...' : 'Relink Wallet Profile'}
                </button>
              </div>

              {/* Edit Modal */}
              {editing && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h3 className="text-lg font-medium mb-4">Edit Profile</h3>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Display Name (Local)</label>
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        placeholder="How your name appears in this app"
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                      <p className="text-xs text-zinc-400 mt-1">
                        Stored locally for this wallet in this app only. Does not change your onchain profile.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Switch Linked Handle</label>
                      <input
                        type="text"
                        value={editLinkedHandle}
                        onChange={(e) => setEditLinkedHandle(e.target.value)}
                        placeholder="existing_linked_handle"
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                      <p className="text-xs text-zinc-400 mt-1">
                        Can only switch to a handle already linked to this wallet in Tapestry.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Bio</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Profile Image URL</label>
                      <input
                        type="url"
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        placeholder="https://example.com/your-photo.jpg"
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2.5 border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column — Activity */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Icon icon="solar:history-bold-duotone" width="24" className="text-zinc-400" />
                  <h3 className="text-lg font-medium">Recent Activity</h3>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Icon icon="solar:document-text-bold-duotone" width="48" className="text-zinc-300 mb-4 mx-auto" />
                    <p>No activity yet. Start exploring to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                            <Icon
                              icon={
                                activity.action === 'LIKE_TRACK' ? 'solar:heart-bold' :
                                activity.action === 'FOLLOW_ARTIST' ? 'solar:user-plus-bold' :
                                activity.action === 'COMMENT' ? 'solar:chat-round-dots-bold' :
                                activity.action === 'CREATE_PROFILE' ? 'solar:user-bold' :
                                'solar:star-bold'
                              }
                              width="16"
                              className="text-zinc-500"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {activity.action.replace(/_/g, ' ').toLowerCase()}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          +{activity.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
