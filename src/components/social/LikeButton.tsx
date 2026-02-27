'use client'

import { Icon } from '@iconify/react'
import { useLike } from '@/hooks'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  contentId: string
  initialCount?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LikeButton({ 
  contentId, 
  initialCount = 0, 
  showCount = true,
  size = 'md' 
}: LikeButtonProps) {
  const { liked, likeCount, loading, toggleLike } = useLike(contentId)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-full border transition-all',
        sizeClasses[size],
        liked 
          ? 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100' 
          : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'
      )}
    >
      <Icon 
        icon={liked ? "solar:heart-bold" : "solar:heart-linear"} 
        width={iconSizes[size]} 
      />
      {showCount && (
        <span className="text-sm font-medium pr-2">{likeCount || initialCount}</span>
      )}
    </button>
  )
}
