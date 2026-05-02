import { Card } from '../common/Card'
import { type GameRoomPlayer } from '../../features/games/types'

export function CurrentTurnBanner({
  currentTurnPlayerId,
  players,
}: {
  currentTurnPlayerId: string | null
  players: GameRoomPlayer[]
}) {
  const currentPlayer = players.find(
    (player) => player.playerId === currentTurnPlayerId,
  )

  return (
    <Card className="border-gold-300/30 bg-gold-300/12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Current turn
      </p>
      <p className="mt-2 text-xl font-black text-cream-50">
        {currentPlayer
          ? currentPlayer.displayName || currentPlayer.username
          : 'Waiting for first player'}
      </p>
      <p className="mt-2 text-sm leading-6 text-cream-100/72">
        The starting player is determined by highest double, then highest pip
        total, then turn order.
      </p>
    </Card>
  )
}
