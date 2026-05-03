import { useEffect, useRef } from 'react'
import { Card } from '../common/Card'
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
    <Card className="overflow-hidden border-gold-300/20 bg-green-950/70 p-0 shadow-wood">
      <div className="border-b border-cream-100/10 bg-gradient-to-r from-wood-900/80 via-felt-700/50 to-wood-900/80 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
          Table board
        </p>
        <p className="mt-1 text-sm text-cream-100/70">
          {isEmpty
            ? 'Board is empty. Start the round by playing a tile.'
            : `${boardState.placements.length} dominoes in play.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pt-3 text-left">
        <div className="rounded-md border border-cream-100/10 bg-green-950/45 px-3 py-2">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-gold-200">
            Left open
          </p>
          <p className="mt-0.5 text-base font-black text-cream-50">
            {boardState.openEnds.left ?? '-'}
          </p>
        </div>
        <div className="rounded-md border border-cream-100/10 bg-green-950/45 px-3 py-2">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-gold-200">
            Right open
          </p>
          <p className="mt-0.5 text-base font-black text-cream-50">
            {boardState.openEnds.right ?? '-'}
          </p>
        </div>
      </div>
      <div
        className="mt-3 h-[400px] max-h-[460px] w-full overflow-auto border-t border-cream-100/10 overscroll-contain sm:h-[430px]"
        ref={viewportRef}
        style={{
          backgroundColor: '#073321',
          backgroundImage:
            'radial-gradient(circle at 50% 42%, rgba(217,184,102,0.13), transparent 28rem), linear-gradient(135deg, rgba(255,255,255,0.045) 0%, transparent 42%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 42px), linear-gradient(180deg, #0b3e28 0%, #082f20 48%, #062317 100%)',
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
              className="absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 rounded-md border border-gold-200/20 bg-green-950/70 px-4 py-5 text-center shadow-wood"
            >
              <p className="text-lg font-black text-cream-50">Center table</p>
              <p className="mt-2 text-sm leading-6 text-cream-100/70">
                Select a domino from your tray and play it on Start.
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
                    ? 'ring-1 ring-gold-200/70 ring-offset-1 ring-offset-green-950 drop-shadow-[0_0_10px_rgba(217,184,102,0.35)]'
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
    </Card>
  )
}
