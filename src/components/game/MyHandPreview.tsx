import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { DominoImageTile } from './DominoImageTile'
import { useAppStore } from '../../app/store'
import { playSound } from '../../features/audio/soundService'
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
  const tableSoundEnabled = useAppStore((state) => state.tableSoundEnabled)
  const canSelect = isRoundActive && isMyTurn && !isActionPending
  const helperText = isRoundActive
    ? isMyTurn
      ? selectedTileId
        ? 'Choose where this domino lands.'
        : 'Choose a tile from your tray.'
      : 'Your hand stays private while you wait.'
    : 'Tile play is closed for this round.'

  return (
    <GameCard className="border-gold-300/28 bg-[radial-gradient(circle_at_50%_0%,rgba(242,193,78,0.18),transparent_18rem),linear-gradient(180deg,rgba(107,63,29,0.46),rgba(11,61,46,0.8)_50%,rgba(42,22,10,0.72))] p-4 shadow-[0_-18px_42px_rgba(42,22,10,0.3)]" variant="wood">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Your seat
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
      <div className="-mx-2 mt-4 flex snap-x gap-3 overflow-x-auto rounded-[1.75rem] border border-gold-200/24 bg-[radial-gradient(circle_at_50%_0%,rgba(255,244,214,0.18),transparent_13rem),linear-gradient(180deg,rgba(31,138,91,0.58),rgba(20,107,74,0.48)_48%,rgba(107,63,29,0.36))] px-3 pb-5 pt-5 shadow-[inset_0_1px_0_rgba(255,244,214,0.24),inset_0_-14px_26px_rgba(0,0,0,0.18),0_14px_34px_rgba(0,0,0,0.18)] [scrollbar-width:thin]">
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
              onClick={() => {
                void playSound('tile-select', { enabled: tableSoundEnabled })
                onSelectTile(tile.id)
              }}
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
