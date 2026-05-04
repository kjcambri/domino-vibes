import { Play } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
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
    <GameCard
      className="relative overflow-hidden bg-felt-700/35"
      variant={canStart ? 'gold' : 'felt'}
    >
      <div className="absolute -right-8 top-4 size-24 rounded-full bg-gold-300/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
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
        </div>
        <StatusChip tone={canStart ? 'gold' : 'cream'}>
          {readyState.readyCount}/4 ready
        </StatusChip>
      </div>
      <p className="relative mt-3 text-sm leading-6 text-cream-100/72">
        Starting deals secure hands, opens the game room, and keeps the table
        together for the round.
      </p>
      <Button
        className="relative mt-5 w-full gap-2"
        disabled={!canStart || isStarting}
        onClick={onStart}
      >
        <Play aria-hidden="true" size={18} />
        {isStarting ? 'Starting...' : 'Start Game'}
      </Button>
    </GameCard>
  )
}
