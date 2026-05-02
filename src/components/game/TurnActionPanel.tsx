import { Card } from '../common/Card'
import { Button } from '../common/Button'

export function TurnActionPanel({
  canPass,
  isMyTurn,
  isRoundActive,
  isActionPending,
  onPass,
}: {
  canPass: boolean
  isMyTurn: boolean
  isRoundActive: boolean
  isActionPending: boolean
  onPass: () => void
}) {
  if (!isRoundActive) {
    return (
      <Card className="border-gold-300/25 bg-gold-300/10">
        <p className="text-sm font-black text-cream-50">Round complete</p>
        <p className="mt-2 text-sm leading-6 text-cream-100/72">
          Scores are saved for this round. Next-round flow is reserved for a
          later sprint.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Turn actions
      </p>
      <div className="mt-4">
        <Button
          className="w-full"
          disabled={!isMyTurn || !canPass || isActionPending}
          onClick={onPass}
          variant="secondary"
        >
          Pass Turn
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-cream-100/72">
        {isMyTurn
          ? canPass
            ? 'No legal tiles are available, so passing is allowed.'
            : 'You have at least one legal play, so passing is locked.'
          : 'Pass becomes available only on your turn when no legal tile fits.'}
      </p>
    </Card>
  )
}
