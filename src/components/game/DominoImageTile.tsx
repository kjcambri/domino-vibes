import { useState } from 'react'
import { cn } from '../../lib/cn'
import { getDominoImageSrc, normalizeTileId } from '../../features/games/dominoAssets'

type DominoImageTileProps = {
  tileId: string
  selected?: boolean
  disabled?: boolean
  playable?: boolean
  size?: 'board' | 'small' | 'medium' | 'large'
  orientation?: 'vertical' | 'horizontal'
  onClick?: () => void
  ariaLabel?: string
  className?: string
}

const sizeClasses = {
  board: {
    vertical: 'h-[56px] w-[28px]',
    horizontal: 'h-[28px] w-[56px]',
    text: 'text-[0.6rem]',
  },
  small: {
    vertical: 'h-[3.375rem] w-[1.6875rem]',
    horizontal: 'h-[1.6875rem] w-[3.375rem]',
    text: 'text-[0.65rem]',
  },
  medium: {
    vertical: 'h-24 w-12',
    horizontal: 'h-12 w-24',
    text: 'text-xs',
  },
  large: {
    vertical: 'h-32 w-16',
    horizontal: 'h-16 w-32',
    text: 'text-sm',
  },
}

export function DominoImageTile({
  tileId,
  selected = false,
  disabled = false,
  playable = false,
  size = 'medium',
  orientation = 'vertical',
  onClick,
  ariaLabel,
  className,
}: DominoImageTileProps) {
  const normalizedTileId = normalizeTileId(tileId)
  const imageSrc = getDominoImageSrc(tileId)
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)
  const hasImageError = failedImageSrc === imageSrc
  const safeOrientation =
    orientation === 'vertical' || orientation === 'horizontal'
      ? orientation
      : 'horizontal'
  const isBoardTile = size === 'board'
  const rootSizeClass = isBoardTile
    ? sizeClasses.board.vertical
    : sizeClasses[size][safeOrientation]

  const baseClassName = cn(
    'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-lg transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950',
    rootSizeClass,
    playable && 'drop-shadow-[0_0_14px_rgba(242,193,78,0.62)]',
    selected && 'ring-2 ring-gold-200 ring-offset-2 ring-offset-green-950 shadow-gold',
    disabled && 'opacity-45 grayscale',
    onClick && !disabled && 'cursor-pointer hover:-translate-y-0.5 active:scale-95',
    className,
  )
  const fallbackParts = normalizedTileId.split('-')
  const content = hasImageError ? (
    <span
      className={cn(
        'grid size-full place-items-center rounded-md border border-cream-900/20 bg-cream-50 font-black text-green-950 shadow-wood',
        sizeClasses[size].text,
      )}
    >
      [{fallbackParts[0]}|{fallbackParts[1]}]
    </span>
  ) : (
    <img
      alt={ariaLabel ?? `Domino ${normalizedTileId}`}
      className={cn(
        'pointer-events-none select-none drop-shadow-[0_8px_10px_rgba(0,0,0,0.36)]',
        isBoardTile ? 'object-cover' : 'object-contain',
        isBoardTile && 'h-full w-full max-w-none',
        !isBoardTile && safeOrientation === 'vertical' && 'h-full w-full',
        !isBoardTile &&
          safeOrientation === 'horizontal' &&
          'h-[150%] w-auto max-w-none rotate-90',
      )}
      draggable={false}
      onError={() => setFailedImageSrc(imageSrc)}
      src={imageSrc}
    />
  )

  if (onClick) {
    return (
      <button
        aria-label={ariaLabel ?? `Domino ${normalizedTileId}`}
        aria-pressed={selected}
        className={baseClassName}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <div
      aria-label={ariaLabel ?? `Domino ${normalizedTileId}`}
      className={baseClassName}
      role="img"
    >
      {content}
    </div>
  )
}
