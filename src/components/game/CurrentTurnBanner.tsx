import { Card } from '../common/Card'
import { type GameRoomPlayer } from '../../features/games/types'

export function CurrentTurnBanner({
  currentTurnPlayerId,
  players,
  currentUserPlayerId,
  status,
  roundWinnerPlayerId,
}: {
  currentTurnPlayerId: string | null
  players: GameRoomPlayer[]
  currentUserPlayerId?: string | null
  status: string
  roundWinnerPlayerId?: string | null
}) {
  const currentPlayer = players.find(
    (player) => player.playerId === currentTurnPlayerId,
  )
  const winner = players.find(
    (player) => player.playerId === roundWinnerPlayerId,
  )
  const isMyTurn = currentTurnPlayerId === currentUserPlayerId

  return (
    <Card className="border-gold-300/30 bg-gold-300/12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        {status === 'round_finished' ? 'Round finished' : 'Current turn'}
      </p>
      <p className="mt-2 text-xl font-black text-cream-50">
        {status === 'round_finished'
          ? winner?.displayName || winner?.username || 'Round scored'
          : currentPlayer
            ? currentPlayer.displayName || currentPlayer.username
            : 'Waiting for first player'}
      </p>
      <p className="mt-2 text-sm leading-6 text-cream-100/72">
        {status === 'round_finished'
          ? 'Scores are updated for this round. Multi-round restart comes later.'
          : isMyTurn
            ? 'Your turn. Play a legal tile or pass only if you have no moves.'
            : 'Waiting on the current player to play or pass.'}
      </p>
    </Card>
  )
}
