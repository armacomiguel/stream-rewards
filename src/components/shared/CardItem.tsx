// src/components/shared/CardItem.tsx
import clsx from 'clsx'
import { Rarity } from '@/types'

interface CardItemProps {
  name: string
  character: string
  imageUrl?: string
  rarity: Rarity
  quantity?: number
  stockRemaining?: number
  stockTotal?: number
  isNew?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const RARITY_LABELS: Record<Rarity, string> = {
  bronze: '🥉 Bronce',
  silver: '🥈 Plata',
  gold:   '🥇 Oro',
}

export default function CardItem({
  name, character, imageUrl, rarity,
  quantity, stockRemaining, stockTotal,
  isNew = false, size = 'md'
}: CardItemProps) {
  const sizes = {
    sm: 'w-28 h-40',
    md: 'w-36 h-52',
    lg: 'w-44 h-64',
  }

  const imgSizes = {
    sm: 'h-20',
    md: 'h-28',
    lg: 'h-36',
  }

  return (
    <div className={clsx(
      'relative rounded-xl border-2 flex flex-col overflow-hidden cursor-default transition-all duration-300',
      `card-${rarity}`,
      sizes[size],
      isNew && 'ring-2 ring-accent ring-offset-2 ring-offset-bg scale-105'
    )}>
      {/* New badge */}
      {isNew && (
        <span className="absolute top-1.5 right-1.5 z-10 text-[9px] font-mono font-bold bg-accent text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          ¡Nueva!
        </span>
      )}

      {/* Quantity badge */}
      {quantity && quantity > 1 && (
        <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded-full">
          ×{quantity}
        </span>
      )}

      {/* Image */}
      <div className={'flex items-center justify-center overflow-hidden'}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-30">🎴</span>
          </div>
        )}
      </div>
    </div>
  )
}
