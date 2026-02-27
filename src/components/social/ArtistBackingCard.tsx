'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useArtistSignals } from '@/hooks'

interface ArtistBackingCardProps {
  artistId: string
  artistName: string
}

export function ArtistBackingCard({ artistId, artistName }: ArtistBackingCardProps) {
  const [note, setNote] = useState('')
  const { signals, loading, submitting, canPost, resolvingProfile, submitSignal } = useArtistSignals(artistId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await submitSignal(note)
    if (ok) setNote('')
  }

  return (
    <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="solar:pen-new-square-bold-duotone" width="20" className="text-zinc-700" />
        <h3 className="text-xl tracking-tight font-medium text-zinc-900">Back This Artist</h3>
      </div>

      <p className="text-sm text-zinc-500 mb-5">
        Post a short conviction note about why <span className="font-medium text-zinc-700">{artistName}</span> is worth watching.
        Notes are written through Tapestry and shown to other fans.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={220}
          placeholder="Example: Strong replay value + rising engagement with still-low follower base."
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
          disabled={!canPost || submitting}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">{note.length}/220</span>
          <button
            type="submit"
            disabled={!canPost || submitting || !note.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="solar:rocket-bold" width="16" />
            {submitting ? 'Posting...' : 'Publish Thesis'}
          </button>
        </div>
      </form>

      {resolvingProfile && (
        <p className="text-xs text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 mb-4">
          Resolving your onchain profile...
        </p>
      )}

      {!resolvingProfile && !canPost && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
          Connect wallet and create/link a profile to post a conviction note.
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent Backers</h4>
          {loading && <span className="text-xs text-zinc-400">Loading...</span>}
        </div>

        {signals.length === 0 ? (
          <p className="text-sm text-zinc-500 py-3">No conviction notes yet.</p>
        ) : (
          signals.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-800">{item.author?.username ?? item.profileId}</span>
                <span className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-zinc-600">{item.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
