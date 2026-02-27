'use client'

import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  isFollowing: boolean
  loading: boolean
  onToggle: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
}

export function FollowButton({
  isFollowing,
  loading,
  onToggle,
  size = 'md',
  variant = 'default',
}: FollowButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-full font-medium transition-all cursor-pointer',
        sizeClasses[size],
        loading && 'opacity-50 cursor-wait',
        isFollowing
          ? variant === 'outline'
            ? 'border border-zinc-200 text-zinc-400 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50'
            : 'bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-500'
          : variant === 'outline'
            ? 'border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white'
            : 'bg-zinc-900 text-white hover:bg-zinc-800'
      )}
    >
      <Icon icon={isFollowing ? "solar:user-check-bold" : "solar:user-plus-linear"} width={16} />
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
