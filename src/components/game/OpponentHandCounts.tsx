import { Card } from '../common/Card'
import { type GameRoomPlayer } from '../../features/games/types'

export function OpponentHandCounts({
  players,
  currentPlayerId,
}: {
  players: GameRoomPlayer[]
  currentPlayerId?: string
}) {
  const opponents = players.filter((player) => player.playerId !== currentPlayerId)

  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Opponent hands
      </p>
      <div className="mt-4 grid gap-2">
        {opponents.map((player) => (
          <div
            className="flex items-center justify-between rounded-md border border-cream-100/10 bg-green-950/45 px-4 py-3"
            key={player.seatNumber}
          >
            <span className="text-sm font-bold text-cream-50">
              {player.displayName || player.username || `Seat ${player.seatNumber}`}
            </span>
            <span className="text-sm font-black text-gold-100">
              {player.handCount} tiles
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
