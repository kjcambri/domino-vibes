import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatPanel } from '../components/chat/ChatPanel'
import { GameCard } from '../components/ui/GameCard'
import { StateCard } from '../components/ui/StateCard'
import { BoardStatePreview } from '../components/game/BoardStatePreview'
import { CurrentTurnBanner } from '../components/game/CurrentTurnBanner'
import { GamePlayerList } from '../components/game/GamePlayerList'
import { GameRoomHeader } from '../components/game/GameRoomHeader'
import { MyHandPreview } from '../components/game/MyHandPreview'
import { OpponentHandCounts } from '../components/game/OpponentHandCounts'
import { RoundFinishedPanel } from '../components/game/RoundFinishedPanel'
import { TurnActionPanel } from '../components/game/TurnActionPanel'
import { MobileShell } from '../components/layout/MobileShell'
import { canHandPlay, getLegalSides } from '../features/games/gameplayRules'
import { type BoardSide } from '../features/games/types'
import { useGamePresence } from '../features/games/useGamePresence'
import { useGameRealtime } from '../features/games/useGameRealtime'
import { useGameRoom } from '../features/games/useGameRoom'
import { getFriendlyAuthError } from '../lib/errors'

export function GameRoomPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const gameRoom = useGameRoom(gameId)
  useGameRealtime(gameId)
  useGamePresence(gameId, Boolean(gameRoom.gameRoom?.currentUser))

  if (gameRoom.isLoading) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <StateCard
            copy="Pulling the table, secure hand, and latest board state."
            title="Loading game..."
            type="loading"
          />
        </div>
      </MobileShell>
    )
  }

  if (gameRoom.isError || !gameRoom.gameRoom) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <StateCard
            copy={`${getFriendlyAuthError(gameRoom.error)} You may need to rejoin from the lobby if you are not seated in this game.`}
            title="Could not open game."
            type="error"
          />
        </div>
      </MobileShell>
    )
  }

  const game = gameRoom.gameRoom.game
  const isRoundActive = game.status === 'active'
  const currentUserPlayerId = gameRoom.gameRoom.currentUser?.playerId
  const isMyTurn = game.currentTurnPlayerId === currentUserPlayerId
  const canPass =
    Boolean(gameRoom.myHand) && !canHandPlay(gameRoom.myHand!.tiles, game.boardState)
  const actionError = gameRoom.playTile.error ?? gameRoom.passTurn.error
  const nextRoundError = gameRoom.startNextRound.error
  const leaveFinishedGameError = gameRoom.leaveFinishedGame.error
  const selectedTile =
    gameRoom.myHand?.tiles.find((tile) => tile.id === selectedTileId) ?? null
  const selectedLegalSides = selectedTile
    ? getLegalSides(selectedTile, game.boardState)
    : []
  const activeSelectedTileId = selectedTile ? selectedTileId : null

  const handlePlayTile = (tileId: string, side: BoardSide) => {
    void gameRoom.playTile
      .mutateAsync({ tileId, side })
      .then(() => setSelectedTileId(null))
      .catch(() => undefined)
  }

  const handlePlaySelectedSide = (side: BoardSide) => {
    if (!activeSelectedTileId) {
      return
    }

    handlePlayTile(activeSelectedTileId, side)
  }

  const handlePass = () => {
    void gameRoom.passTurn
      .mutateAsync()
      .then(() => setSelectedTileId(null))
      .catch(() => undefined)
  }

  const handleStartNextRound = () => {
    void gameRoom.startNextRound
      .mutateAsync()
      .then(() => setSelectedTileId(null))
      .catch(() => undefined)
  }

  const handleReturnToLobby = () => {
    void gameRoom.leaveFinishedGame
      .mutateAsync()
      .then(() => {
        setSelectedTileId(null)
        void navigate('/lobby')
      })
      .catch(() => undefined)
  }

  return (
    <MobileShell className="max-w-6xl">
      <div className="flex flex-1 flex-col gap-4 py-4">
        <GameRoomHeader game={game} />
        <CurrentTurnBanner
          currentTurnPlayerId={game.currentTurnPlayerId}
          currentUserPlayerId={currentUserPlayerId}
          players={gameRoom.gameRoom.players}
          roundWinnerPlayerId={game.roundWinnerPlayerId}
          status={game.status}
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="grid min-w-0 gap-4">
            <BoardStatePreview boardState={game.boardState} />
            <MyHandPreview
              boardState={game.boardState}
              hand={gameRoom.myHand}
              isActionPending={gameRoom.isActionPending}
              isMyTurn={isMyTurn}
              isRoundActive={isRoundActive}
              onSelectTile={setSelectedTileId}
              selectedTileId={activeSelectedTileId}
            />
          </div>
          <div className="grid gap-4 lg:sticky lg:top-4">
            <OpponentHandCounts
              currentPlayerId={gameRoom.myHand?.playerId}
              currentTurnPlayerId={game.currentTurnPlayerId}
              players={gameRoom.gameRoom.players}
            />
            <GameCard className="border-cream-100/10 bg-green-950/42 p-4">
              <p className="text-sm leading-6 text-cream-100/72">
                Active and away status is visible now. Disconnected-player
                handling arrives later, so players can return and continue.
              </p>
            </GameCard>
            <RoundFinishedPanel
              currentUserPlayerId={currentUserPlayerId}
              game={game}
              isLeavingFinishedGame={gameRoom.leaveFinishedGame.isPending}
              isStartingNextRound={gameRoom.startNextRound.isPending}
              leaveFinishedGameErrorMessage={
                leaveFinishedGameError
                  ? getFriendlyAuthError(leaveFinishedGameError)
                  : null
              }
              nextRoundErrorMessage={
                nextRoundError ? getFriendlyAuthError(nextRoundError) : null
              }
              onReturnToLobby={handleReturnToLobby}
              onStartNextRound={handleStartNextRound}
              players={gameRoom.gameRoom.players}
            />
            <TurnActionPanel
              canPass={canPass}
              errorMessage={actionError ? getFriendlyAuthError(actionError) : null}
              isActionPending={gameRoom.isActionPending}
              isMyTurn={isMyTurn}
              isRoundActive={isRoundActive}
              legalSides={selectedLegalSides}
              onPlaySide={handlePlaySelectedSide}
              onPass={handlePass}
              openEnds={game.boardState.openEnds}
              selectedTileId={activeSelectedTileId}
              status={game.status}
            />
            <GamePlayerList
              currentTurnPlayerId={game.currentTurnPlayerId}
              players={gameRoom.gameRoom.players}
            />
            <ChatPanel
              compact
              roomId={game.id}
              roomType="game"
              title="Table Talk"
            />
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
