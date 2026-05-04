import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import {
  getDominoAssetCandidates,
  normalizeTileId,
} from '../../features/games/dominoAssets'

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
  const imageSources = useMemo(() => {
    const { optimizedSrc, pngSrc } = getDominoAssetCandidates(tileId)

    return [optimizedSrc, pngSrc]
  }, [tileId])
  const [imageSourceState, setImageSourceState] = useState({
    index: 0,
    tileId,
  })
  const imageSourceIndex =
    imageSourceState.tileId === tileId ? imageSourceState.index : 0
  const imageSrc = imageSources[imageSourceIndex]
  const hasImageError = imageSourceIndex >= imageSources.length
  const safeOrientation =
    orientation === 'vertical' || orientation === 'horizontal'
      ? orientation
      : 'horizontal'
  const isBoardTile = size === 'board'
  const rootSizeClass = isBoardTile
    ? sizeClasses.board.vertical
    : sizeClasses[size][safeOrientation]

  const baseClassName = cn(
    'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-lg border border-cream-950/10 bg-cream-50/10 transition-[box-shadow,filter,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950',
    rootSizeClass,
    isBoardTile
      ? 'shadow-[0_5px_10px_rgba(0,0,0,0.38),0_1px_0_rgba(255,244,214,0.28)]'
      : 'shadow-[0_14px_22px_rgba(17,7,2,0.42),0_2px_0_rgba(255,244,214,0.24)]',
    playable &&
      'drop-shadow-[0_0_14px_rgba(242,193,78,0.58)] ring-1 ring-gold-200/65',
    selected &&
      'z-10 -translate-y-1 ring-2 ring-gold-200 ring-offset-2 ring-offset-green-950 shadow-[0_18px_34px_rgba(242,193,78,0.3),0_12px_28px_rgba(0,0,0,0.5)]',
    disabled && 'opacity-45 grayscale',
    onClick &&
      !disabled &&
      'cursor-pointer hover:-translate-y-1 hover:brightness-110 active:translate-y-0 active:scale-95',
    className,
  )

  const fallbackParts = normalizedTileId.split('-')
  const content = hasImageError ? (
    <span
      className={cn(
        'grid size-full place-items-center rounded-md border border-cream-900/20 bg-[linear-gradient(145deg,#fff7e4,#eadab8)] font-black text-green-950 shadow-wood',
        sizeClasses[size].text,
      )}
    >
      [{fallbackParts[0]}|{fallbackParts[1]}]
    </span>
  ) : (
    <img
      alt={ariaLabel ?? `Domino ${normalizedTileId}`}
      className={cn(
        'pointer-events-none select-none',
        isBoardTile ? 'object-cover' : 'object-contain',
        isBoardTile && 'h-full w-full max-w-none',
        !isBoardTile && safeOrientation === 'vertical' && 'h-full w-full',
        !isBoardTile &&
          safeOrientation === 'horizontal' &&
          'h-[150%] w-auto max-w-none rotate-90',
      )}
      draggable={false}
      onError={() =>
        setImageSourceState((currentState) => ({
          index:
            currentState.tileId === tileId ? currentState.index + 1 : 1,
          tileId,
        }))
      }
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
