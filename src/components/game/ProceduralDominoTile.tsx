import { cn } from '../../lib/cn'
import {
  getDominoAriaLabel,
  getPipPositions,
  parseDominoTileId,
  type PipPosition,
} from '../../features/games/dominoRendering'
import { type DominoOrientation, type DominoTileDto } from '../../features/games/types'

type ProceduralDominoSize =
  | 'tiny'
  | 'board'
  | 'small'
  | 'medium'
  | 'large'
  | 'hand'

export type ProceduralDominoTileProps = {
  tileId?: string
  tile?: Pick<DominoTileDto, 'id' | 'left' | 'right'>
  left?: number
  right?: number
  size?: ProceduralDominoSize
  orientation?: DominoOrientation
  rotation?: number
  selected?: boolean
  disabled?: boolean
  playable?: boolean
  isLatest?: boolean
  isStart?: boolean
  hidden?: boolean
  className?: string
  onClick?: () => void
  ariaLabel?: string
}

const sizeClasses: Record<
  ProceduralDominoSize,
  {
    vertical: string
    horizontal: string
    pip: string
    pipCore: string
    fallbackText: string
    markText: string
  }
> = {
  tiny: {
    vertical: 'h-9 w-[18px]',
    horizontal: 'h-[18px] w-9',
    pip: 'size-[3.5px]',
    pipCore: 'size-[2.5px]',
    fallbackText: 'text-[0.45rem]',
    markText: 'text-[0.45rem]',
  },
  board: {
    vertical: 'h-[56px] w-[28px]',
    horizontal: 'h-[28px] w-[56px]',
    pip: 'size-[5px]',
    pipCore: 'size-[3.6px]',
    fallbackText: 'text-[0.55rem]',
    markText: 'text-[0.45rem]',
  },
  small: {
    vertical: 'h-[3.375rem] w-[1.6875rem]',
    horizontal: 'h-[1.6875rem] w-[3.375rem]',
    pip: 'size-[5px]',
    pipCore: 'size-[3.6px]',
    fallbackText: 'text-[0.6rem]',
    markText: 'text-[0.48rem]',
  },
  medium: {
    vertical: 'h-24 w-12',
    horizontal: 'h-12 w-24',
    pip: 'size-2',
    pipCore: 'size-1.5',
    fallbackText: 'text-xs',
    markText: 'text-[0.6rem]',
  },
  large: {
    vertical: 'h-32 w-16',
    horizontal: 'h-16 w-32',
    pip: 'size-2.5',
    pipCore: 'size-2',
    fallbackText: 'text-sm',
    markText: 'text-xs',
  },
  hand: {
    vertical: 'h-32 w-16',
    horizontal: 'h-16 w-32',
    pip: 'size-2.5',
    pipCore: 'size-2',
    fallbackText: 'text-sm',
    markText: 'text-xs',
  },
}

const pipGridClasses: Record<PipPosition, string> = {
  'top-left': 'col-start-1 row-start-1',
  'top-center': 'col-start-2 row-start-1',
  'top-right': 'col-start-3 row-start-1',
  'middle-left': 'col-start-1 row-start-2',
  center: 'col-start-2 row-start-2',
  'middle-right': 'col-start-3 row-start-2',
  'bottom-left': 'col-start-1 row-start-3',
  'bottom-center': 'col-start-2 row-start-3',
  'bottom-right': 'col-start-3 row-start-3',
}

export function ProceduralDominoTile({
  tileId,
  tile,
  left,
  right,
  size = 'medium',
  orientation = 'vertical',
  rotation,
  selected = false,
  disabled = false,
  playable = false,
  isLatest = false,
  isStart = false,
  hidden = false,
  className,
  onClick,
  ariaLabel,
}: ProceduralDominoTileProps) {
  const safeOrientation =
    orientation === 'vertical' || orientation === 'horizontal'
      ? orientation
      : 'vertical'
  const parsedTile = tileId ? parseDominoTileId(tileId) : null
  const tileValues = resolveTileValues({ left, parsedTile, right, tile })
  const resolvedLabel =
    ariaLabel ??
    (hidden
      ? 'Hidden domino'
      : tileValues
        ? getDominoAriaLabel(tileValues)
        : 'Domino tile unavailable')
  const rootClassName = cn(
    'relative inline-grid shrink-0 place-items-center overflow-visible rounded-[14%] transition-[box-shadow,filter,opacity,scale,translate] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950',
    sizeClasses[size][safeOrientation],
    size === 'board'
      ? 'shadow-[0_7px_10px_rgba(0,0,0,0.42),2px_3px_3px_rgba(42,22,10,0.28),-1px_-1px_0_rgba(255,244,214,0.22)]'
      : 'shadow-[0_18px_26px_rgba(17,7,2,0.46),3px_5px_7px_rgba(42,22,10,0.36),-1px_-1px_0_rgba(255,244,214,0.24)]',
    playable &&
      'drop-shadow-[0_0_14px_rgba(242,193,78,0.58)] ring-1 ring-gold-200/65',
    selected &&
      'z-10 -translate-y-1 scale-[1.035] ring-2 ring-gold-200 ring-offset-2 ring-offset-green-950 shadow-[0_22px_38px_rgba(242,193,78,0.32),0_14px_30px_rgba(0,0,0,0.52),2px_5px_6px_rgba(42,22,10,0.34)]',
    isLatest &&
      'ring-1 ring-teal-300/70 ring-offset-1 ring-offset-green-950 drop-shadow-[0_0_14px_rgba(69,221,189,0.34)]',
    isStart &&
      'ring-1 ring-gold-200/80 ring-offset-1 ring-offset-green-950 drop-shadow-[0_0_14px_rgba(242,193,78,0.42)]',
    disabled && 'opacity-45 grayscale',
    onClick &&
      !disabled &&
      'cursor-pointer hover:-translate-y-1 hover:brightness-110 active:translate-y-0 active:scale-95',
    className,
  )
  const style = Number.isFinite(rotation) ? { rotate: `${rotation}deg` } : undefined
  const content = hidden ? (
    <DominoBack orientation={safeOrientation} size={size} />
  ) : tileValues ? (
    <DominoFront
      left={tileValues.left}
      orientation={safeOrientation}
      right={tileValues.right}
      size={size}
    />
  ) : (
    <DominoFallback size={size} />
  )

  if (onClick) {
    return (
      <button
        aria-label={resolvedLabel}
        aria-pressed={selected}
        className={rootClassName}
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
      aria-label={resolvedLabel}
      className={rootClassName}
      role="img"
      style={style}
    >
      {content}
    </div>
  )
}

function resolveTileValues({
  left,
  parsedTile,
  right,
  tile,
}: {
  left?: number
  parsedTile: { left: number; right: number } | null
  right?: number
  tile?: Pick<DominoTileDto, 'left' | 'right'>
}): { left: number; right: number } | null {
  if (isValidPip(left) && isValidPip(right)) {
    return { left, right }
  }

  if (tile && isValidPip(tile.left) && isValidPip(tile.right)) {
    return { left: tile.left, right: tile.right }
  }

  return parsedTile
}

function isValidPip(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6
}

function DominoFront({
  left,
  orientation,
  right,
  size,
}: {
  left: number
  orientation: DominoOrientation
  right: number
  size: ProceduralDominoSize
}) {
  return (
    <div
      className={cn(
        'relative grid size-full overflow-hidden rounded-[14%] border border-[#8b6f3f]/45 bg-[radial-gradient(circle_at_24%_14%,rgba(255,255,255,0.92),transparent_28%),radial-gradient(circle_at_72%_78%,rgba(141,95,37,0.26),transparent_42%),linear-gradient(145deg,#fff9ea_0%,#f4e5c3_42%,#dec58f_74%,#b88e4b_100%)] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.92),inset_-2px_-2px_4px_rgba(83,52,21,0.36),inset_0_0_0_1px_rgba(255,244,214,0.32)]',
        orientation === 'horizontal'
          ? 'grid-cols-[1fr_1px_1fr]'
          : 'grid-rows-[1fr_1px_1fr]',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px] rounded-[12%] border border-white/42 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.6),inset_-1px_-1px_2px_rgba(64,39,15,0.22)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[14%] opacity-35 [background-image:radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.75)_0_1px,transparent_1.6px),radial-gradient(circle_at_68%_74%,rgba(83,52,21,0.18)_0_1px,transparent_1.8px)] [background-size:9px_9px,11px_11px]"
      />
      <DominoHalf size={size} value={left} />
      <DominoDivider orientation={orientation} size={size} />
      <DominoHalf size={size} value={right} />
    </div>
  )
}

function DominoHalf({
  size,
  value,
}: {
  size: ProceduralDominoSize
  value: number
}) {
  return (
    <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-0.5 p-[13%]">
      {getPipPositions(value).map((position) => (
        <span
          aria-hidden="true"
          className={cn(
            'grid place-self-center place-items-center rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(255,244,214,0.18),rgba(18,14,9,0.96)_38%,#030201_78%)] shadow-[inset_0_1px_1px_rgba(255,244,214,0.18),inset_0_-1px_1px_rgba(0,0,0,0.9),0_0_0_1px_rgba(76,48,21,0.62),0_1px_0_rgba(255,244,214,0.18)]',
            sizeClasses[size].pip,
            pipGridClasses[position],
          )}
          key={position}
        >
          <span
            aria-hidden="true"
            className={cn(
              'rounded-full bg-[radial-gradient(circle_at_36%_28%,#3a3125_0%,#080604_62%,#000_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]',
              sizeClasses[size].pipCore,
            )}
          />
        </span>
      ))}
    </div>
  )
}

function DominoDivider({
  orientation,
  size,
}: {
  orientation: DominoOrientation
  size: ProceduralDominoSize
}) {
  const showRivet = size === 'medium' || size === 'large' || size === 'hand'

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-10 overflow-visible bg-[#5a4525]/58 shadow-[inset_1px_1px_0_rgba(255,244,214,0.28),inset_-1px_-1px_1px_rgba(34,20,8,0.44)]',
        orientation === 'horizontal' ? 'h-full w-px' : 'h-px w-full',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute bg-white/34',
          orientation === 'horizontal'
            ? 'left-px top-0 h-full w-px'
            : 'left-0 top-px h-px w-full',
        )}
      />
      {showRivet ? (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 grid size-2 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#6b4d22]/54 bg-[radial-gradient(circle_at_34%_28%,#fff2c8_0%,#d2a950_48%,#5c3d16_100%)] shadow-[0_1px_1px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.46)]"
        />
      ) : null}
    </span>
  )
}

function DominoBack({
  orientation,
  size,
}: {
  orientation: DominoOrientation
  size: ProceduralDominoSize
}) {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden rounded-[14%] border border-gold-200/48 bg-[radial-gradient(circle_at_28%_14%,rgba(69,221,189,0.3),transparent_32%),radial-gradient(circle_at_76%_82%,rgba(0,0,0,0.48),transparent_45%),linear-gradient(145deg,#1f8a5b_0%,#0b3d2e_46%,#061f18_100%)] shadow-[inset_1px_1px_1px_rgba(255,244,214,0.24),inset_-2px_-2px_5px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(69,221,189,0.12)]">
      <div
        aria-hidden="true"
        className={cn(
          'absolute rounded-[12%] border border-gold-200/42 shadow-[inset_1px_1px_1px_rgba(255,244,214,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.32)]',
          orientation === 'horizontal'
            ? 'inset-x-[8%] inset-y-[18%]'
            : 'inset-x-[18%] inset-y-[8%]',
        )}
      />
      <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(45deg,transparent_0_7px,rgba(255,244,214,0.12)_7px_8px),radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.16)_0_1px,transparent_1.8px)] [background-size:auto,10px_10px]" />
      <span
        aria-hidden="true"
        className={cn(
          'relative rounded-full border border-gold-200/48 bg-green-950/50 px-1.5 py-0.5 font-black tracking-[0.16em] text-gold-100/76 shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,244,214,0.14)]',
          sizeClasses[size].markText,
        )}
      >
        DV
      </span>
    </div>
  )
}

function DominoFallback({ size }: { size: ProceduralDominoSize }) {
  return (
    <div className="grid size-full place-items-center rounded-[14%] border border-red-300/30 bg-[radial-gradient(circle_at_25%_16%,rgba(255,255,255,0.78),transparent_30%),linear-gradient(145deg,#fff7e4,#eadab8)] font-black text-green-950 shadow-wood">
      <span className={sizeClasses[size].fallbackText}>?</span>
    </div>
  )
}
