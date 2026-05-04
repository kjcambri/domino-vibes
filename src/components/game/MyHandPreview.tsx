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
    <GameCard className="border-gold-300/22 bg-[radial-gradient(circle_at_18%_0%,rgba(242,193,78,0.14),transparent_16rem),linear-gradient(180deg,rgba(107,63,29,0.34),rgba(11,61,46,0.82)_58%,rgba(42,22,10,0.62))] p-4 shadow-[0_-14px_36px_rgba(42,22,10,0.24)]" variant="wood">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Your rack
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
      <div className="-mx-2 mt-4 flex snap-x gap-3 overflow-x-auto rounded-3xl border border-gold-200/20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,244,214,0.16),transparent_13rem),linear-gradient(180deg,rgba(31,138,91,0.56),rgba(20,107,74,0.46)_52%,rgba(107,63,29,0.28))] px-3 pb-5 pt-5 shadow-[inset_0_1px_0_rgba(255,244,214,0.22),inset_0_-10px_22px_rgba(0,0,0,0.16),0_12px_28px_rgba(0,0,0,0.14)] [scrollbar-width:thin]">
        {hand?.tiles.map((tile) => {
          const legalSides = getLegalSides(tile, boardState)
          const playable = canSelect && legalSides.length > 0

          return (
            <DominoImageTile
              ariaLabel={`Select domino ${tile.id}`}
              className={
                selectedTileId === tile.id
                  ? 'snap-center -translate-y-2'
                  : 'snap-center'
              }
              disabled={!canSelect}
              key={tile.id}
              onClick={() => onSelectTile(tile.id)}
              playable={playable}
              selected={selectedTileId === tile.id}
              size="hand"
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
