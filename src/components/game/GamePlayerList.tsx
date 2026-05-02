import { CircleCheck, UserRound } from 'lucide-react'
import { Card } from '../common/Card'
import { type GameRoomPlayer } from '../../features/games/types'

export function GamePlayerList({
  players,
  currentTurnPlayerId,
}: {
  players: GameRoomPlayer[]
  currentTurnPlayerId?: string | null
}) {
  return (
    <section className="grid gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Players
      </p>
      {players.map((player) => (
        <Card
          className={
            player.playerId === currentTurnPlayerId
              ? 'flex items-center gap-3 border-gold-300/35 p-4'
              : 'flex items-center gap-3 p-4'
          }
          key={player.seatNumber}
        >
          <span className="grid size-10 place-items-center rounded-md border border-cream-100/12 bg-green-950/45 text-cream-100">
            {player.playerId === currentTurnPlayerId ? (
              <CircleCheck aria-hidden="true" size={18} />
            ) : (
              <UserRound aria-hidden="true" size={18} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-200">
              Seat {player.seatNumber}
            </p>
            <p className="mt-1 font-black text-cream-50">
              {player.displayName || player.username || 'Open seat'}
            </p>
            <p className="mt-1 text-sm text-cream-100/65">
              {player.handCount} tiles · Score {player.score} · Round{' '}
              {player.roundScore}
            </p>
          </div>
          {player.hasPassed ? (
            <span className="rounded-full border border-cream-100/10 bg-cream-100/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cream-100/75">
              Passed
            </span>
          ) : null}
        </Card>
      ))}
    </section>
  )
}
