import { Card } from '../common/Card'
import { getPlayerPresence } from '../../features/games/presence'
import { type GameRoomPlayer } from '../../features/games/types'

export function OpponentHandCounts({
  players,
  currentPlayerId,
  currentTurnPlayerId,
}: {
  players: GameRoomPlayer[]
  currentPlayerId?: string
  currentTurnPlayerId?: string | null
}) {
  const opponents = players.filter((player) => player.playerId !== currentPlayerId)

  return (
    <Card className="bg-green-950/58">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
          Opponents
        </p>
        <p className="text-xs font-bold text-cream-100/55">Counts only</p>
      </div>
      <div className="mt-4 grid gap-2">
        {opponents.map((player) => (
          <OpponentRow
            currentTurnPlayerId={currentTurnPlayerId}
            key={player.seatNumber}
            player={player}
          />
        ))}
      </div>
    </Card>
  )
}

function OpponentRow({
  player,
  currentTurnPlayerId,
}: {
  player: GameRoomPlayer
  currentTurnPlayerId?: string | null
}) {
  const presence = getPlayerPresence({
    isConnected: player.isConnected,
    lastSeenAt: player.lastSeenAt,
  })

  return (
    <div
      className={
        player.playerId === currentTurnPlayerId
          ? 'rounded-md border border-gold-300/35 bg-gold-300/10 px-4 py-3'
          : 'rounded-md border border-cream-100/10 bg-green-950/45 px-4 py-3'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-cream-50">
            {player.displayName || player.username || `Seat ${player.seatNumber}`}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-cream-100/55">
            Seat {player.seatNumber}
          </p>
        </div>
        {player.playerId === currentTurnPlayerId ? (
          <span className="rounded-full bg-gold-300 px-2 py-1 text-[0.65rem] font-black uppercase text-green-950">
            Turn
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-cream-100/10 px-3 py-1 text-xs font-bold text-cream-50">
          {player.handCount} tiles
        </span>
        <span className="rounded-full bg-gold-300/15 px-3 py-1 text-xs font-bold text-gold-100">
          {player.score} points
        </span>
        <span className="rounded-full bg-felt-300/14 px-3 py-1 text-xs font-bold text-felt-50">
          {presence.label}
        </span>
        {player.hasPassed ? (
          <span className="rounded-full bg-red-800/25 px-3 py-1 text-xs font-bold text-red-100">
            Passed
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-semibold text-cream-100/50">
        {presence.description}
      </p>
    </div>
  )
}
