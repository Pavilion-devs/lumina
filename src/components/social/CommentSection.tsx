'use client'

import { useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { createComment, getComments } from '@/lib/tapestry'
import { addPoints } from '@/lib/rewards'
import { useProfileId } from '@/hooks/useProfileId'
import type { TapestryComment } from '@/types'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
  contentId: string
}

export function CommentSection({ contentId }: CommentSectionProps) {
  const [comments, setComments] = useState<TapestryComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const { profileId, walletAddress } = useProfileId()

  const loadComments = async () => {
    try {
      const loadedComments = await getComments(contentId)
      setComments(loadedComments)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId || !newComment.trim()) return

    setLoading(true)
    try {
      const comment = await createComment(profileId, contentId, newComment.trim())
      setComments((prev) => [comment, ...prev])
      setNewComment('')
      if (walletAddress) addPoints(walletAddress, 'COMMENT', { trackId: contentId })
    } catch (err) {
      console.error('Error creating comment:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    if (!showComments && comments.length === 0) {
      loadComments()
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={toggleComments}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm">{comments.length} Comments</span>
      </button>

      {showComments && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {profileId && (
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg transition-colors',
                  newComment.trim()
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-500'
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-purple-400">
                    {comment.author?.username ?? comment.profileId}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{comment.text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
