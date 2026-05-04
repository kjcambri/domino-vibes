import { createDominoBoardLayout, type VisualDominoPlacement } from '../../features/games/boardLayout'
import { type BoardStateDto } from '../../features/games/types'
import { cn } from '../../lib/cn'
import { DominoImageTile } from './DominoImageTile'
import {
  computeMiniBoardBounds,
  getMiniBoardTransform,
} from './miniBoardPreviewUtils'

const MINI_BOARD_WIDTH = 360
const MINI_BOARD_HEIGHT = 232

function isRenderablePlacement(placement: VisualDominoPlacement) {
  return (
    Number.isFinite(placement.x) &&
    Number.isFinite(placement.y) &&
    Number.isFinite(placement.rotation) &&
    (placement.orientation === 'horizontal' ||
      placement.orientation === 'vertical')
  )
}

export function MiniBoardPreview({
  boardState,
  className,
}: {
  boardState: Pick<BoardStateDto, 'placements'>
  className?: string
}) {
  const layout = createDominoBoardLayout(boardState.placements)
  const renderableLayout = layout.filter(isRenderablePlacement)
  const bounds = computeMiniBoardBounds(renderableLayout)
  const transform = getMiniBoardTransform({
    bounds,
    viewportHeight: MINI_BOARD_HEIGHT,
    viewportWidth: MINI_BOARD_WIDTH,
  })

  return (
    <div
      className={cn(
        'relative min-h-56 overflow-hidden rounded-3xl border border-gold-300/18 bg-green-950 shadow-[inset_0_0_70px_rgba(0,0,0,0.48)]',
        className,
      )}
      style={{
        backgroundColor: '#0b3d2e',
        backgroundImage:
          'radial-gradient(circle at 50% 44%, rgba(242,193,78,0.16), transparent 11rem), radial-gradient(circle at 18% 15%, rgba(31,138,91,0.32), transparent 10rem), repeating-linear-gradient(125deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 22px), linear-gradient(180deg, #146B4A 0%, #0B3D2E 58%, #061F18 100%)',
      }}
    >
      {renderableLayout.length === 0 ? (
        <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl border border-cream-100/10 bg-green-950/72 px-4 py-3 text-center text-sm font-bold text-cream-100/76">
          Waiting for the first tile.
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            height: MINI_BOARD_HEIGHT,
            transform: 'translate(-50%, -50%)',
            width: MINI_BOARD_WIDTH,
          }}
        >
          {renderableLayout.map((placement) => (
            <div
              className="absolute"
              key={`${placement.turnNumber}-${placement.tileId}`}
              style={{
                left: transform.translateX + placement.x * transform.scale,
                top: transform.translateY + placement.y * transform.scale,
                transform: `translate(-50%, -50%) rotate(${placement.rotation}deg) scale(${transform.scale})`,
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
                orientation={placement.orientation}
                size="board"
                tileId={placement.tileId}
              />
            </div>
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-6 bottom-4 rounded-2xl border border-cream-100/10 bg-green-950/58 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-teal-200/90 backdrop-blur">
        Read-only public board preview
      </div>
    </div>
  )
}
