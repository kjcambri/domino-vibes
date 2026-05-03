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
  const currentName =
    currentPlayer?.displayName || currentPlayer?.username || 'another player'
  const winnerName = winner?.displayName || winner?.username || 'Round winner'
  const isFinished = status === 'finished'

  return (
    <Card
      className={
        isMyTurn && status === 'active'
          ? 'border-gold-300/45 bg-gold-300/14 shadow-gold'
          : 'border-cream-100/10 bg-green-950/65'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            {isFinished
              ? 'Game over'
              : status === 'round_finished'
                ? 'Round finished'
                : 'Current turn'}
          </p>
          <p className="mt-2 text-xl font-black text-cream-50">
            {isFinished
              ? 'Final points are in'
              : status === 'round_finished'
                ? `${winnerName} won the round`
                : isMyTurn
                  ? 'Your turn'
                  : `Waiting for ${currentName}`}
          </p>
        </div>
        {isMyTurn && status === 'active' ? (
          <span className="rounded-full bg-gold-300 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-950">
            Play
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-cream-100/72">
        {isFinished
          ? 'This game is complete. Return to the lobby when you are ready.'
          : status === 'round_finished'
            ? 'Round-win points are updated. Start the next round if the game is still alive.'
            : isMyTurn
              ? 'Pick a tile from your tray, then choose a side.'
              : 'The table will update as soon as the move lands.'}
      </p>
    </Card>
  )
}
