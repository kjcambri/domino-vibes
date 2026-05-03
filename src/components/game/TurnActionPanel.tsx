import { Card } from '../common/Card'
import { Button } from '../common/Button'
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
      <Card className="border-gold-300/25 bg-gold-300/10">
        <p className="text-sm font-black text-cream-50">
          {isFinished ? 'Game over' : 'Round complete'}
        </p>
        <p className="mt-2 text-sm leading-6 text-cream-100/72">
          {isFinished
            ? 'Final points are saved. Tile play is closed for this game.'
            : 'Round-win points are saved. Start the next round when the table is ready.'}
        </p>
      </Card>
    )
  }

  const isBoardEmpty = openEnds.left === null && openEnds.right === null
  const playSides: BoardSide[] = isBoardEmpty ? ['start'] : ['left', 'right']
  const controlsDisabled = !isMyTurn || isActionPending || !selectedTileId

  return (
    <Card className="border-gold-300/15 bg-green-950/70">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Turn actions
      </p>
      <p className="mt-2 text-lg font-black text-cream-50">
        {!isMyTurn
          ? 'Waiting for your turn'
          : selectedTileId
            ? `Selected ${selectedTileId}`
            : 'Select a tile to play'}
      </p>
      <div className="mt-4 grid gap-2">
        {playSides.map((side) => (
          <Button
            className="w-full"
            disabled={controlsDisabled || !legalSides.includes(side)}
            key={side}
            onClick={() => onPlaySide(side)}
            variant={legalSides.includes(side) ? 'primary' : 'ghost'}
          >
            Play {side === 'start' ? 'Start' : side === 'left' ? 'Left' : 'Right'}
          </Button>
        ))}
        <Button
          className="w-full"
          disabled={!isMyTurn || !canPass || isActionPending}
          onClick={onPass}
          variant="secondary"
        >
          Pass Turn
        </Button>
      </div>
      {errorMessage ? (
        <p className="mt-3 rounded-md border border-red-300/25 bg-red-800/20 px-3 py-2 text-sm font-bold text-red-100">
          {errorMessage}
        </p>
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
    </Card>
  )
}
