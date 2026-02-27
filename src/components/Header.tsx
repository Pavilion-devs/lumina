'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { WalletButton } from '@/components/wallet'

export function Header() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 backdrop-blur-md bg-zinc-50/80 border-b border-zinc-200/50">
      <div className="flex items-center gap-3 relative z-10 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Icon icon="solar:music-notes-bold-duotone" width="28" className="text-zinc-900" />
          <span className="text-xl tracking-tighter font-semibold font-display uppercase">
            Lumina
          </span>
        </Link>

        <div className="ml-auto hidden md:flex items-center gap-8">
          <Link
            href="/discover"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-tight"
          >
            Discover
          </Link>
          <Link
            href="/signals"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-tight"
          >
            Signals
          </Link>
          <Link
            href="/feed"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-tight"
          >
            Feed
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-tight"
          >
            Leaderboard
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors uppercase tracking-tight"
          >
            Profile
          </Link>
        </div>

        <div className="ml-8">
          <WalletButton />
        </div>

        <button className="md:hidden ml-4">
          <Icon icon="solar:hamburger-menu-linear" width="24" />
        </button>
      </div>
    </nav>
  )
}
