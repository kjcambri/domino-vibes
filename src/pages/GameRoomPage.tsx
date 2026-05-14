import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatPanel } from '../components/chat/ChatPanel'
import { StateCard } from '../components/ui/StateCard'
import { BoardStatePreview } from '../components/game/BoardStatePreview'
import { CurrentTurnBanner } from '../components/game/CurrentTurnBanner'
import { GamePlayerList } from '../components/game/GamePlayerList'
import { GameRoomHeader } from '../components/game/GameRoomHeader'
import { MyHandPreview } from '../components/game/MyHandPreview'
import { RoundFinishedPanel } from '../components/game/RoundFinishedPanel'
import { SeatedOpponentRack } from '../components/game/SeatedOpponentRack'
import { TurnActionPanel } from '../components/game/TurnActionPanel'
import { MobileShell } from '../components/layout/MobileShell'
import { useAppStore } from '../app/store'
import { useGameSoundEvents } from '../features/audio/useSoundEvents'
import { canHandPlay, getLegalSides } from '../features/games/gameplayRules'
import { getRelativeTableSeats } from '../features/games/tableSeating'
import { type BoardSide } from '../features/games/types'
import { useGamePresence } from '../features/games/useGamePresence'
import { useGameRealtime } from '../features/games/useGameRealtime'
import { useGameRoom } from '../features/games/useGameRoom'
import { getFriendlyAuthError } from '../lib/errors'

export function GameRoomPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const tableSoundEnabled = useAppStore((state) => state.tableSoundEnabled)
  const gameRoom = useGameRoom(gameId)
  useGameRealtime(gameId)
  useGamePresence(gameId, Boolean(gameRoom.gameRoom?.currentUser))
  useGameSoundEvents({
    currentUserPlayerId: gameRoom.gameRoom?.currentUser?.playerId,
    enabled: tableSoundEnabled,
    game: gameRoom.gameRoom?.game ?? null,
  })

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
  const tableSeats = getRelativeTableSeats(
    gameRoom.gameRoom.players,
    currentUserPlayerId,
  )

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
    <MobileShell className="max-w-[1500px]">
      <div className="flex flex-1 flex-col gap-4 py-4">
        <GameRoomHeader game={game} />
        <CurrentTurnBanner
          currentTurnPlayerId={game.currentTurnPlayerId}
          currentUserPlayerId={currentUserPlayerId}
          players={gameRoom.gameRoom.players}
          roundWinnerPlayerId={game.roundWinnerPlayerId}
          status={game.status}
        />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="grid min-w-0 gap-4">
            <section
              aria-label="Seated domino table"
              className="grid gap-3 rounded-[2rem] border border-gold-300/18 bg-[radial-gradient(circle_at_50%_18%,rgba(242,193,78,0.12),transparent_20rem),linear-gradient(145deg,rgba(42,22,10,0.68),rgba(6,31,24,0.54))] p-3 shadow-[0_30px_80px_rgba(17,7,2,0.34)] xl:grid-cols-[190px_minmax(0,1fr)_190px] xl:p-4 2xl:grid-cols-[220px_minmax(0,1fr)_220px]"
            >
              <div className="xl:col-start-2">
                <SeatedOpponentRack
                  currentTurnPlayerId={game.currentTurnPlayerId}
                  player={tableSeats.top}
                  position="top"
                />
              </div>
              <div className="grid gap-3 xl:col-span-3 xl:grid-cols-[190px_minmax(0,1fr)_190px] xl:items-center 2xl:grid-cols-[220px_minmax(0,1fr)_220px]">
                <div className="xl:col-start-1">
                  <SeatedOpponentRack
                    currentTurnPlayerId={game.currentTurnPlayerId}
                    player={tableSeats.left}
                    position="left"
                  />
                </div>
                <div className="min-w-0 xl:col-start-2">
                  <BoardStatePreview boardState={game.boardState} />
                </div>
                <div className="xl:col-start-3">
                  <SeatedOpponentRack
                    currentTurnPlayerId={game.currentTurnPlayerId}
                    player={tableSeats.right}
                    position="right"
                  />
                </div>
              </div>
            </section>
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

          <aside className="grid gap-4 xl:sticky xl:top-4">
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
              defaultOpen
              roomId={game.id}
              roomType="game"
              title="Table Talk"
            />
          </aside>
        </div>
      </div>
    </MobileShell>
  )
}
