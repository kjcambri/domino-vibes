import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import {
  getDominoImageFallbackSources,
  normalizeTileId,
  USE_PROCEDURAL_DOMINOES,
} from '../../features/games/dominoAssets'
import { type DominoTileDto } from '../../features/games/types'
import { ProceduralDominoTile } from './ProceduralDominoTile'

type DominoTileSize = 'tiny' | 'board' | 'small' | 'medium' | 'large' | 'hand'

type DominoImageTileProps = {
  tileId?: string
  tile?: Pick<DominoTileDto, 'id' | 'left' | 'right'>
  left?: number
  right?: number
  selected?: boolean
  disabled?: boolean
  playable?: boolean
  isLatest?: boolean
  isStart?: boolean
  hidden?: boolean
  size?: DominoTileSize
  orientation?: 'vertical' | 'horizontal'
  rotation?: number
  onClick?: () => void
  ariaLabel?: string
  className?: string
}

const sizeClasses = {
  tiny: {
    vertical: 'h-9 w-[18px]',
    horizontal: 'h-[18px] w-9',
    text: 'text-[0.45rem]',
  },
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
  hand: {
    vertical: 'h-32 w-16',
    horizontal: 'h-16 w-32',
    text: 'text-sm',
  },
}

export function DominoImageTile(props: DominoImageTileProps) {
  if (USE_PROCEDURAL_DOMINOES) {
    return (
      <ProceduralDominoTile
        {...props}
        orientation={props.size === 'board' ? 'vertical' : props.orientation}
      />
    )
  }

  return <DominoPhotoAssetTile {...props} />
}

function DominoPhotoAssetTile({
  tileId,
  selected = false,
  disabled = false,
  playable = false,
  isLatest = false,
  isStart = false,
  hidden = false,
  size = 'medium',
  orientation = 'vertical',
  rotation,
  onClick,
  ariaLabel,
  className,
}: DominoImageTileProps) {
  const safeTileId = hidden ? 'domino-back' : tileId ?? '0-0'
  const normalizedTileId = normalizeTileId(safeTileId)
  const imageSources = useMemo(
    () => getDominoImageFallbackSources(safeTileId),
    [safeTileId],
  )
  const [imageSourceState, setImageSourceState] = useState({
    index: 0,
    tileId: safeTileId,
  })
  const imageSourceIndex =
    imageSourceState.tileId === safeTileId ? imageSourceState.index : 0
  const imageSrc = imageSources[imageSourceIndex]
  const hasImageError = imageSourceIndex >= imageSources.length
  const safeOrientation =
    orientation === 'vertical' || orientation === 'horizontal'
      ? orientation
      : 'horizontal'
  const isBoardTile = size === 'board'
  const isHandTile = size === 'hand' || size === 'large'
  const rootSizeClass = isBoardTile
    ? sizeClasses.board.vertical
    : sizeClasses[size][safeOrientation]
  const style = Number.isFinite(rotation) ? { rotate: `${rotation}deg` } : undefined

  const baseClassName = cn(
    'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-lg transition-[box-shadow,filter,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950',
    rootSizeClass,
    isBoardTile
      ? 'border border-cream-950/10 bg-cream-50/10 shadow-[0_5px_10px_rgba(0,0,0,0.38),0_1px_0_rgba(255,244,214,0.28)]'
      : 'border border-cream-900/10 bg-transparent shadow-[0_16px_24px_rgba(17,7,2,0.34),0_3px_0_rgba(255,244,214,0.18)]',
    isHandTile &&
      'rounded-xl shadow-[0_18px_30px_rgba(17,7,2,0.34),0_3px_0_rgba(255,244,214,0.2)]',
    playable &&
      'drop-shadow-[0_0_14px_rgba(242,193,78,0.58)] ring-1 ring-gold-200/65',
    selected &&
      'z-10 -translate-y-1 ring-2 ring-gold-200 ring-offset-2 ring-offset-green-950 shadow-[0_18px_34px_rgba(242,193,78,0.3),0_12px_28px_rgba(0,0,0,0.5)]',
    isLatest &&
      'ring-1 ring-teal-300/70 ring-offset-1 ring-offset-green-950 drop-shadow-[0_0_14px_rgba(69,221,189,0.34)]',
    isStart &&
      'ring-1 ring-gold-200/80 ring-offset-1 ring-offset-green-950 drop-shadow-[0_0_14px_rgba(242,193,78,0.42)]',
    disabled && 'opacity-85 saturate-[0.96] brightness-[1.01]',
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
      {hidden ? '?' : `[${fallbackParts[0]}|${fallbackParts[1]}]`}
    </span>
  ) : (
    <img
      alt={ariaLabel ?? (hidden ? 'Hidden domino' : `Domino ${normalizedTileId}`)}
      className={cn(
        'pointer-events-none select-none',
        isBoardTile || isHandTile ? 'object-cover' : 'object-contain',
        isBoardTile && 'h-full w-full max-w-none',
        isHandTile &&
          safeOrientation === 'vertical' &&
          'h-full w-full max-w-none',
        isHandTile &&
          safeOrientation === 'horizontal' &&
          'h-[150%] w-auto max-w-none rotate-90',
        !isBoardTile &&
          !isHandTile &&
          safeOrientation === 'vertical' &&
          'h-full w-full max-w-none object-cover',
        !isBoardTile &&
          !isHandTile &&
          safeOrientation === 'horizontal' &&
          'h-[150%] w-auto max-w-none rotate-90',
      )}
      draggable={false}
      onError={() =>
        setImageSourceState((currentState) => ({
          index:
            currentState.tileId === safeTileId ? currentState.index + 1 : 1,
          tileId: safeTileId,
        }))
      }
      src={imageSrc}
    />
  )

  if (onClick) {
    return (
      <button
        aria-label={ariaLabel ?? (hidden ? 'Hidden domino' : `Domino ${normalizedTileId}`)}
        aria-pressed={selected}
        className={baseClassName}
        disabled={disabled}
        onClick={onClick}
        style={style}
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <div
      aria-label={ariaLabel ?? (hidden ? 'Hidden domino' : `Domino ${normalizedTileId}`)}
      className={baseClassName}
      role="img"
      style={style}
    >
      {content}
    </div>
  )
}
