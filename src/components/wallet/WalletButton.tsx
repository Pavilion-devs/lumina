'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Icon } from '@iconify/react'

export function WalletButton() {
  const { connected } = useWallet()

  return (
    <WalletMultiButton 
      startIcon={connected ? undefined : <Icon icon="solar:wallet-bold-duotone" width="18" />}
      className="!bg-zinc-900 hover:!bg-zinc-800 !rounded-full !font-medium !transition-all !text-white !text-sm !px-5 !py-2.5"
    />
  )
}
