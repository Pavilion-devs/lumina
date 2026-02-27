'use client'

import { Icon } from '@iconify/react'
import type { SupporterBadge } from '@/lib/reputation'

interface SupporterBadgeStripProps {
  score: number
  tier: string
  badges: SupporterBadge[]
  compact?: boolean
}

export function SupporterBadgeStrip({ score, tier, badges, compact = false }: SupporterBadgeStripProps) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
        <Icon icon="solar:shield-star-bold-duotone" width={compact ? 14 : 16} className="text-emerald-600" />
        <span className={`font-semibold text-emerald-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          Supporter Score {score} · {tier}
        </span>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700"
            >
              <Icon icon={badge.icon} width={12} className="text-zinc-500" />
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

