import { getTrendingTracks } from '@/lib/audius'
import { getUndervaluedArtistSignals } from '@/lib/signals'
import { getArtistSignals, getComments } from '@/lib/tapestry'
import type { FeedEvent } from '@/types'

async function getBackingEvents(limitArtists = 10, notesPerArtist = 2): Promise<FeedEvent[]> {
  const artists = await getUndervaluedArtistSignals(limitArtists)

  const notesByArtist = await Promise.all(
    artists.map(async (artist) => {
      try {
        const notes = await getArtistSignals(artist.artistId, notesPerArtist, 0)
        return { artist, notes }
      } catch {
        return { artist, notes: [] }
      }
    })
  )

  const items: FeedEvent[] = []

  for (const { artist, notes } of notesByArtist) {
    for (const note of notes) {
      items.push({
        id: `back-${note.id}`,
        type: 'back',
        createdAt: note.createdAt,
        actorLabel: note.author?.username ?? note.profileId,
        text: note.text,
        href: `/artist/${artist.artistId}`,
        context: `${artist.name} @${artist.handle}`,
        signalScore: artist.signalScore,
        attentionPerFollower: artist.attentionPerFollower,
      })
    }
  }

  return items
}

async function getTrackCommentEvents(limitTracks = 8, commentsPerTrack = 2): Promise<FeedEvent[]> {
  const tracks = await getTrendingTracks(limitTracks, 0)

  const commentsByTrack = await Promise.all(
    tracks.map(async (track) => {
      try {
        const comments = await getComments(track.id, commentsPerTrack, 0)
        return { track, comments }
      } catch {
        return { track, comments: [] }
      }
    })
  )

  const items: FeedEvent[] = []

  for (const { track, comments } of commentsByTrack) {
    for (const comment of comments) {
      items.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        createdAt: comment.createdAt,
        actorLabel: comment.author?.username ?? comment.profileId,
        text: comment.text,
        href: `/track/${track.id}`,
        context: `${track.title} by ${track.user.name}`,
      })
    }
  }

  return items
}

export async function getGlobalFeedEvents(): Promise<FeedEvent[]> {
  const [backs, comments] = await Promise.all([
    getBackingEvents(10, 2),
    getTrackCommentEvents(8, 2),
  ])

  return [...backs, ...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
