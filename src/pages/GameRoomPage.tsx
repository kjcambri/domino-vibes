import { useParams } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { BoardStatePreview } from '../components/game/BoardStatePreview'
import { CurrentTurnBanner } from '../components/game/CurrentTurnBanner'
import { GamePlaceholderBoard } from '../components/game/GamePlaceholderBoard'
import { GamePlayerList } from '../components/game/GamePlayerList'
import { GameRoomHeader } from '../components/game/GameRoomHeader'
import { MyHandPreview } from '../components/game/MyHandPreview'
import { OpponentHandCounts } from '../components/game/OpponentHandCounts'
import { MobileShell } from '../components/layout/MobileShell'
import { useGameRealtime } from '../features/games/useGameRealtime'
import { useGameRoom } from '../features/games/useGameRoom'
import { getFriendlyAuthError } from '../lib/errors'

export function GameRoomPage() {
  const { gameId } = useParams()
  const gameRoom = useGameRoom(gameId)
  useGameRealtime(gameId)

  if (gameRoom.isLoading) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <Card>
            <p className="text-sm font-bold text-cream-50">Loading game...</p>
            <p className="mt-2 text-sm leading-6 text-cream-100/70">
              Checking the placeholder game setup.
            </p>
          </Card>
        </div>
      </MobileShell>
    )
  }

  if (gameRoom.isError || !gameRoom.gameRoom) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <Card className="border-red-300/30 bg-red-800/20">
            <p className="text-sm font-bold text-red-100">
              Could not open game.
            </p>
            <p className="mt-2 text-sm leading-6 text-red-100/80">
              {getFriendlyAuthError(gameRoom.error)}
            </p>
          </Card>
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 py-4">
        <GameRoomHeader game={gameRoom.gameRoom.game} />
        <CurrentTurnBanner
          currentTurnPlayerId={gameRoom.gameRoom.game.currentTurnPlayerId}
          players={gameRoom.gameRoom.players}
        />
        <GamePlaceholderBoard />
        <BoardStatePreview boardState={gameRoom.gameRoom.game.boardState} />
        <MyHandPreview hand={gameRoom.myHand} />
        <OpponentHandCounts
          currentPlayerId={gameRoom.myHand?.playerId}
          players={gameRoom.gameRoom.players}
        />
        <GamePlayerList players={gameRoom.gameRoom.players} />
      </div>
    </MobileShell>
  )
}
