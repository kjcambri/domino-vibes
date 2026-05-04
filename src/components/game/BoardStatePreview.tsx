import { useEffect, useRef } from 'react'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { DominoImageTile } from './DominoImageTile'
import { createDominoBoardLayout } from '../../features/games/boardLayout'
import { type BoardStateDto } from '../../features/games/types'
import { logDebug } from '../../lib/logger'

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
    if (invalidPlacements.length > 0) {
      logDebug('Invalid board placements skipped by renderer', {
        invalidPlacements,
      })
    }
  }, [invalidPlacements])

  return (
    <GameCard className="overflow-hidden rounded-[2rem] border-wood-800/80 p-0 shadow-[0_34px_100px_rgba(17,7,2,0.56)]" variant="wood">
      <div className="flex items-center justify-between gap-3 border-b border-gold-300/18 bg-[linear-gradient(100deg,rgba(42,22,10,0.95),rgba(11,61,46,0.82)_54%,rgba(107,63,29,0.48))] px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Island elite table
          </p>
          <p className="mt-1 text-sm text-cream-100/70">
            {isEmpty
              ? 'Center table is open.'
              : `${boardState.placements.length} dominoes in play.`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <StatusChip className="min-h-8 px-2.5" tone="gold">
            Left {boardState.openEnds.left ?? '-'}
          </StatusChip>
          <StatusChip className="min-h-8 px-2.5" tone="gold">
            Right {boardState.openEnds.right ?? '-'}
          </StatusChip>
        </div>
      </div>
      <div
        className="h-[390px] max-h-[560px] w-full overflow-auto overscroll-contain border-[10px] border-wood-900/90 bg-green-950 shadow-[inset_0_0_0_1px_rgba(255,244,214,0.16),inset_0_18px_36px_rgba(255,244,214,0.08),inset_0_-26px_60px_rgba(0,0,0,0.45)] sm:h-[430px] xl:h-[560px]"
        ref={viewportRef}
        style={{
          backgroundColor: '#0b3d2e',
          backgroundImage:
            'radial-gradient(circle at 50% 44%, rgba(242,193,78,0.16), transparent 18rem), radial-gradient(circle at 18% 15%, rgba(31,138,91,0.32), transparent 17rem), radial-gradient(circle at 84% 78%, rgba(217,79,48,0.12), transparent 18rem), repeating-linear-gradient(125deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 22px), repeating-linear-gradient(35deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 34px), linear-gradient(180deg, #146B4A 0%, #0B3D2E 55%, #061F18 100%)',
          backgroundPosition: 'center',
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, auto, auto, 100% 100%',
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
              className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gold-200/30 bg-green-950/78 px-5 py-6 text-center shadow-[0_22px_60px_rgba(0,0,0,0.42),0_0_34px_rgba(242,193,78,0.16)] backdrop-blur"
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
                isLatest={placement.isLatest}
                isStart={placement.isStart}
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
