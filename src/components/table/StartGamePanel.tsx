import { Play } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { type ReadyState } from '../../features/tables/types'

type StartGamePanelProps = {
  readyState: ReadyState
  isStarting: boolean
  onStart: () => void
}

export function StartGamePanel({
  readyState,
  isStarting,
  onStart,
}: StartGamePanelProps) {
  const waitingForPlayers = readyState.isFull
    ? 0
    : Math.max(readyState.seatedCount > 0 ? 4 - readyState.seatedCount : 4, 0)
  const canStart = readyState.isFull && readyState.allReady

  return (
    <Card className="bg-felt-700/35">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Start game
      </p>
      <h2 className="mt-2 text-xl font-black text-cream-50">
        {canStart
          ? 'All players ready'
          : readyState.isFull
            ? `${readyState.readyCount}/4 players ready`
            : `Waiting for ${waitingForPlayers} more ${
                waitingForPlayers === 1 ? 'player' : 'players'
              }`}
      </h2>
      <p className="mt-3 text-sm leading-6 text-cream-100/72">
        Starting creates a placeholder game record. The domino engine arrives in
        Sprint 5.
      </p>
      <Button
        className="mt-5 w-full gap-2"
        disabled={!canStart || isStarting}
        onClick={onStart}
      >
        <Play aria-hidden="true" size={18} />
        {isStarting ? 'Starting...' : 'Start Game'}
      </Button>
    </Card>
  )
}
