import { AlertTriangle, ArrowLeft, ArrowRight, CircleSlash, Play } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { type BoardSide, type GameStatus } from '../../features/games/types'

export function TurnActionPanel({
  canPass,
  isMyTurn,
  isRoundActive,
  isActionPending,
  legalSides,
  selectedTileId,
  openEnds,
  errorMessage,
  status,
  onPlaySide,
  onPass,
}: {
  canPass: boolean
  isMyTurn: boolean
  isRoundActive: boolean
  isActionPending: boolean
  legalSides: BoardSide[]
  selectedTileId: string | null
  openEnds: {
    left: number | null
    right: number | null
  }
  errorMessage?: string | null
  status: GameStatus
  onPlaySide: (side: BoardSide) => void
  onPass: () => void
}) {
  if (!isRoundActive) {
    const isFinished = status === 'finished'

    return (
      <GameCard className="border-gold-300/25 bg-gold-300/10" variant="gold">
        <p className="text-sm font-black text-cream-50">
          {isFinished ? 'Game over' : 'Round complete'}
        </p>
        <p className="mt-2 text-sm leading-6 text-cream-100/72">
          {isFinished
            ? 'Final points are saved. Tile play is closed for this game.'
            : 'Round-win points are saved. Start the next round when the table is ready.'}
        </p>
      </GameCard>
    )
  }

  const isBoardEmpty = openEnds.left === null && openEnds.right === null
  const playSides: BoardSide[] = isBoardEmpty ? ['start'] : ['left', 'right']
  const controlsDisabled = !isMyTurn || isActionPending || !selectedTileId
  const selectedLabel = selectedTileId ? `Selected ${selectedTileId}` : 'No tile selected'
  const busyLabel = selectedTileId ? 'Playing...' : 'Passing...'

  return (
    <GameCard className="border-teal-300/16 bg-green-950/72">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Action dock
          </p>
          <p className="mt-2 text-lg font-black text-cream-50">
            {!isMyTurn
              ? 'Waiting for your turn'
              : selectedTileId
                ? selectedLabel
                : 'Select a tile to play'}
          </p>
        </div>
        <StatusChip
          className={isMyTurn ? 'bg-gold-300 text-green-950' : ''}
          tone={isMyTurn ? 'gold' : 'cream'}
        >
          {isMyTurn ? 'Ready' : 'Locked'}
        </StatusChip>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2" aria-busy={isActionPending}>
        {playSides.map((side) => (
          <Button
            className={
              playSides.length === 1
                ? 'col-span-2 w-full gap-2 active:scale-[0.98]'
                : 'w-full gap-2 active:scale-[0.98]'
            }
            disabled={controlsDisabled || !legalSides.includes(side)}
            key={side}
            onClick={() => onPlaySide(side)}
            variant={legalSides.includes(side) ? 'primary' : 'ghost'}
          >
            {side === 'left' ? (
              <ArrowLeft aria-hidden="true" size={18} />
            ) : side === 'right' ? (
              <ArrowRight aria-hidden="true" size={18} />
            ) : (
              <Play aria-hidden="true" size={18} />
            )}
            {isActionPending
              ? busyLabel
              : `Play ${side === 'start' ? 'Start' : side === 'left' ? 'Left' : 'Right'}`}
          </Button>
        ))}
        <Button
          className="col-span-2 w-full gap-2 active:scale-[0.98]"
          disabled={!isMyTurn || !canPass || isActionPending}
          onClick={onPass}
          variant="secondary"
        >
          <CircleSlash aria-hidden="true" size={18} />
          {isActionPending && !selectedTileId ? 'Passing...' : 'Pass Turn'}
        </Button>
      </div>
      {isActionPending ? (
        <p className="mt-3 rounded-2xl border border-gold-300/25 bg-gold-300/12 px-3 py-2 text-sm font-bold text-gold-100">
          Sending your move to the table...
        </p>
      ) : null}
      {errorMessage ? (
        <div
          className="mt-3 flex gap-2 rounded-2xl border border-red-300/25 bg-red-800/20 px-3 py-3 text-sm font-bold text-red-100"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
          <p>{errorMessage}</p>
        </div>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-cream-100/72">
        {isMyTurn
          ? selectedTileId
            ? `Open ends: left ${openEnds.left ?? '-'} · right ${openEnds.right ?? '-'}.`
            : canPass
              ? 'No legal tiles are available, so passing is allowed.'
              : 'Pick one of your glowing tiles to continue the chain.'
          : 'Pass becomes available only on your turn when no legal tile fits.'}
      </p>
    </GameCard>
  )
}
