import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
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
  const helperText = isRoundActive
    ? isMyTurn
      ? selectedTileId
        ? 'Choose where this domino lands.'
        : 'Choose a tile from your tray.'
      : 'Your hand stays private while you wait.'
    : 'Tile play is closed for this round.'

  return (
    <GameCard className="border-gold-300/20 bg-gradient-to-b from-wood-800/38 via-wood-900/88 to-green-950/95 p-4 shadow-[0_-18px_50px_rgba(42,22,10,0.45)]" variant="wood">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Your Hand
          </p>
          <p className="mt-1 text-sm text-cream-100/65">
            {helperText}
          </p>
        </div>
        {isMyTurn && isRoundActive ? (
          <StatusChip className="bg-gold-300 text-green-950" tone="gold">
            {selectedTileId ? `Selected ${selectedTileId}` : 'Your turn'}
          </StatusChip>
        ) : (
          <StatusChip tone="cream">{hand?.tiles.length ?? 0} tiles</StatusChip>
        )}
      </div>
      <div className="-mx-2 mt-4 flex snap-x gap-3 overflow-x-auto rounded-3xl border border-cream-100/10 bg-[linear-gradient(180deg,rgba(6,31,24,0.72),rgba(42,22,10,0.72))] px-3 pb-5 pt-5 shadow-[inset_0_0_32px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,244,214,0.08)] [scrollbar-width:thin]">
        {hand?.tiles.map((tile) => {
          const legalSides = getLegalSides(tile, boardState)
          const playable = canSelect && legalSides.length > 0

          return (
            <DominoImageTile
              ariaLabel={`Select domino ${tile.id}`}
              className={selectedTileId === tile.id ? 'snap-center -translate-y-2' : 'snap-center'}
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
      <p className="mt-3 text-sm leading-6 text-cream-100/72">
        {isMyTurn && isRoundActive
          ? selectedTileId
            ? `Domino ${selectedTileId} is ready. Choose a side when the table accepts it.`
            : 'Glowing tiles can play right now. Every move is still validated by the server.'
          : 'Only you can see these dominoes; opponents see counts only.'}
      </p>
    </GameCard>
  )
}
