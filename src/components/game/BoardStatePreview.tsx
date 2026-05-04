import { useEffect, useRef } from 'react'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { DominoImageTile } from './DominoImageTile'
import { createDominoBoardLayout } from '../../features/games/boardLayout'
import { type BoardStateDto } from '../../features/games/types'

const BOARD_PADDING = 150
const BASE_BOARD_WIDTH = 720
const BASE_BOARD_HEIGHT = 520

function isRenderablePlacement(placement: ReturnType<typeof createDominoBoardLayout>[number]) {
  return (
    Number.isFinite(placement.x) &&
    Number.isFinite(placement.y) &&
    Number.isFinite(placement.rotation) &&
    ['horizontal', 'vertical'].includes(placement.orientation)
  )
}

export function BoardStatePreview({ boardState }: { boardState: BoardStateDto }) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const isEmpty = boardState.placements.length === 0
  const layout = createDominoBoardLayout(boardState.placements)
  const renderableLayout = layout.filter(isRenderablePlacement)
  const invalidPlacements = layout.filter(
    (placement) => !isRenderablePlacement(placement),
  )
  const minX = Math.min(0, ...renderableLayout.map((placement) => placement.x))
  const maxX = Math.max(0, ...renderableLayout.map((placement) => placement.x))
  const minY = Math.min(0, ...renderableLayout.map((placement) => placement.y))
  const maxY = Math.max(0, ...renderableLayout.map((placement) => placement.y))
  const boardWidth = Math.max(
    BASE_BOARD_WIDTH,
    Math.max(Math.abs(minX), Math.abs(maxX)) * 2 + BOARD_PADDING * 2,
  )
  const boardHeight = Math.max(
    BASE_BOARD_HEIGHT,
    Math.max(Math.abs(minY), Math.abs(maxY)) * 2 + BOARD_PADDING * 2,
  )
  const originX = boardWidth / 2
  const originY = boardHeight / 2

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    viewport.scrollLeft = Math.max(0, originX - viewport.clientWidth / 2)
    viewport.scrollTop = Math.max(0, originY - viewport.clientHeight / 2)
  }, [boardState.placements.length, originX, originY])

  useEffect(() => {
    if (import.meta.env.DEV && invalidPlacements.length > 0) {
      console.debug('Invalid board placements skipped by renderer', invalidPlacements)
    }
  }, [invalidPlacements])

  return (
    <GameCard className="overflow-hidden p-0 shadow-[0_28px_80px_rgba(17,7,2,0.46)]" variant="wood">
      <div className="flex items-center justify-between gap-3 border-b border-gold-300/15 bg-gradient-to-r from-wood-900/86 via-green-950/72 to-wood-800/40 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Felt table
          </p>
          <p className="mt-1 text-sm text-cream-100/70">
            {isEmpty
              ? 'Center table is open.'
              : `${boardState.placements.length} dominoes in play.`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <StatusChip tone="gold">L {boardState.openEnds.left ?? '-'}</StatusChip>
          <StatusChip tone="gold">R {boardState.openEnds.right ?? '-'}</StatusChip>
        </div>
      </div>
      <div
        className="h-[390px] max-h-[460px] w-full overflow-auto overscroll-contain border-[10px] border-wood-900/85 bg-green-950 shadow-[inset_0_0_0_1px_rgba(255,244,214,0.12)] sm:h-[430px]"
        ref={viewportRef}
        style={{
          backgroundColor: '#0b3d2e',
          backgroundImage:
            'radial-gradient(circle at 50% 42%, rgba(242,193,78,0.12), transparent 25rem), radial-gradient(circle at 18% 16%, rgba(31,138,91,0.26), transparent 18rem), repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 28px), linear-gradient(180deg, #146B4A 0%, #0B3D2E 54%, #061F18 100%)',
          backgroundPosition: 'center',
          backgroundSize: '100% 100%, 100% 100%, auto, 100% 100%',
        }}
      >
        <div
          className="relative rounded-sm"
          style={{
            height: boardHeight,
            width: boardWidth,
            boxShadow:
              'inset 0 0 0 1px rgba(248,239,211,0.08), inset 0 0 90px rgba(1,15,10,0.58)',
          }}
        >
          {isEmpty ? (
            <div
              className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gold-200/25 bg-green-950/78 px-5 py-6 text-center shadow-gold backdrop-blur"
            >
              <p className="text-lg font-black text-cream-50">Center table</p>
              <p className="mt-2 text-sm leading-6 text-cream-100/70">
                Select a domino from your tray and start the chain.
              </p>
            </div>
          ) : null}
          {renderableLayout.map((placement) => (
            <div
              className="absolute transition"
              key={`${placement.turnNumber}-${placement.tileId}`}
              style={{
                left: originX + placement.x,
                top: originY + placement.y,
                transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
              }}
            >
              <DominoImageTile
                ariaLabel={
                  placement.isStart
                    ? `Starting domino ${placement.tileId}`
                    : `Played domino ${placement.tileId}`
                }
                className={
                  placement.isStart
                    ? 'ring-1 ring-gold-200/80 ring-offset-1 ring-offset-green-950 drop-shadow-[0_0_14px_rgba(242,193,78,0.45)]'
                    : ''
                }
                playable={placement.isLatest}
                orientation={placement.orientation}
                size="board"
                tileId={placement.tileId}
              />
            </div>
          ))}
        </div>
      </div>
    </GameCard>
  )
}
