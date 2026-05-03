import { Card } from '../common/Card'
import { DominoImageTile } from './DominoImageTile'
import { getLegalSides } from '../../features/games/gameplayRules'
import { type BoardStateDto, type MyHand } from '../../features/games/types'

export function MyHandPreview({
  hand,
  boardState,
  isMyTurn,
  isRoundActive,
  isActionPending,
  selectedTileId,
  onSelectTile,
}: {
  hand: MyHand | null
  boardState: BoardStateDto
  isMyTurn: boolean
  isRoundActive: boolean
  isActionPending: boolean
  selectedTileId: string | null
  onSelectTile: (tileId: string) => void
}) {
  const canSelect = isRoundActive && isMyTurn && !isActionPending

  return (
    <Card className="border-gold-300/18 bg-gradient-to-b from-wood-900/85 via-green-950/95 to-wood-900/90 p-4 shadow-wood">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            Your Hand
          </p>
          <p className="mt-1 text-sm text-cream-100/65">
            {hand?.tiles.length ?? 0} private tiles
          </p>
        </div>
        {isMyTurn && isRoundActive ? (
          <span className="rounded-full bg-gold-300 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-950">
            Your turn
          </span>
        ) : null}
      </div>
      <div className="-mx-2 mt-4 flex gap-3 overflow-x-auto px-2 pb-3 pt-2">
        {hand?.tiles.map((tile) => {
          const legalSides = getLegalSides(tile, boardState)
          const playable = canSelect && legalSides.length > 0

          return (
            <DominoImageTile
              ariaLabel={`Select domino ${tile.id}`}
              className={selectedTileId === tile.id ? '-translate-y-2' : ''}
              disabled={!canSelect}
              key={tile.id}
              onClick={() => onSelectTile(tile.id)}
              playable={playable}
              selected={selectedTileId === tile.id}
              size="large"
              tileId={tile.id}
            />
          )
        })}
      </div>
      <p className="mt-4 text-sm leading-6 text-cream-100/72">
        {isMyTurn && isRoundActive
          ? 'Select a domino, then choose where to play it. The server validates every move.'
          : 'Secure hands stay private while you wait for your turn.'}
      </p>
    </Card>
  )
}
