import { LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { ChatPanel } from '../components/chat/ChatPanel'
import { GameCard } from '../components/ui/GameCard'
import { StateCard } from '../components/ui/StateCard'
import { MobileShell } from '../components/layout/MobileShell'
import { ReadyToggle } from '../components/table/ReadyToggle'
import { StartGamePanel } from '../components/table/StartGamePanel'
import { TableRoomHeader } from '../components/table/TableRoomHeader'
import { TableSeatGrid } from '../components/table/TableSeatGrid'
import { useAuth } from '../features/auth/useAuth'
import { useTableRealtime } from '../features/tables/useTableRealtime'
import {
  useLeaveTable,
  useSitAtTable,
  useStartGame,
  useTableRoom,
  useToggleReady,
} from '../features/tables/useTableRoom'
import { useTablePresence } from '../features/tables/useTablePresence'
import { getFriendlyAuthError } from '../lib/errors'

export function TableRoomPage() {
  const navigate = useNavigate()
  const { tableId } = useParams()
  const { user } = useAuth()
  const tableRoom = useTableRoom(tableId)
  const sitAtTable = useSitAtTable(tableId)
  const leaveTable = useLeaveTable(tableId)
  const toggleReady = useToggleReady(tableId)
  const startGame = useStartGame(tableId)
  const [error, setError] = useState('')
  useTableRealtime(tableId)

  const room = tableRoom.data
  const currentUserSeat = room?.seats.find((seat) => seat.playerId === user?.id)
  const isCurrentUserSeated = Boolean(currentUserSeat)
  const readyState = useMemo(() => {
    const seats = room?.seats ?? []
    const seatedCount = seats.filter((seat) => seat.playerId).length
    const readyCount = seats.filter((seat) => seat.playerId && seat.isReady).length
    const maxPlayers = room?.table.maxPlayers ?? 4

    return {
      seatedCount,
      readyCount,
      isFull: seatedCount === maxPlayers,
      allReady: seatedCount === maxPlayers && readyCount === maxPlayers,
    }
  }, [room])
  const canSit =
    Boolean(room) &&
    room!.table.status === 'waiting' &&
    !isCurrentUserSeated &&
    !sitAtTable.isPending
  const canLeave =
    Boolean(room) &&
    isCurrentUserSeated &&
    room!.table.status !== 'in_game' &&
    !leaveTable.isPending
  const canToggleReady =
    Boolean(room) &&
    isCurrentUserSeated &&
    room!.table.status !== 'in_game' &&
    room!.table.status !== 'finished' &&
    room!.table.status !== 'closed'
  useTablePresence(
    tableId,
    Boolean(
      room &&
        isCurrentUserSeated &&
        (room.table.status === 'waiting' || room.table.status === 'full'),
    ),
  )

  useEffect(() => {
    if (room?.table.status === 'in_game' && room.table.currentGameId) {
      navigate(`/games/${room.table.currentGameId}`, { replace: true })
    }
  }, [navigate, room?.table.currentGameId, room?.table.status])

  async function handleSit(seatNumber: number) {
    setError('')

    try {
      await sitAtTable.mutateAsync(seatNumber)
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    }
  }

  async function handleLeave() {
    setError('')

    try {
      await leaveTable.mutateAsync()
      navigate('/lobby', { replace: true })
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    }
  }

  async function handleToggleReady() {
    if (!currentUserSeat) {
      return
    }

    setError('')

    try {
      await toggleReady.mutateAsync(!currentUserSeat.isReady)
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    }
  }

  async function handleStartGame() {
    setError('')

    try {
      const result = await startGame.mutateAsync()
      navigate(`/games/${result.gameId}`, { replace: true })
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    }
  }

  if (tableRoom.isLoading) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <StateCard
            copy="Syncing seats and table status."
            title="Loading table..."
            type="loading"
          />
        </div>
      </MobileShell>
    )
  }

  if (tableRoom.isError || !room) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <StateCard
            copy={getFriendlyAuthError(tableRoom.error)}
            title="Could not open table."
            type="error"
          />
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell className="max-w-5xl">
      <div className="flex flex-1 flex-col gap-5 py-4">
        <TableRoomHeader table={room.table} />

        {error ? (
          <div
            className="rounded-2xl border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <TableSeatGrid
          canSit={canSit}
          currentUserId={user?.id}
          isBusy={sitAtTable.isPending}
          onSit={handleSit}
          seats={room.seats}
        />

        {canToggleReady ? (
          <ReadyToggle
            isLoading={toggleReady.isPending}
            isReady={Boolean(currentUserSeat?.isReady)}
            onToggle={handleToggleReady}
          />
        ) : null}

        {canLeave ? (
          <Button
            className="w-full gap-2"
            disabled={leaveTable.isPending}
            onClick={handleLeave}
            variant="danger"
          >
            <LogOut aria-hidden="true" size={18} />
            {leaveTable.isPending ? 'Leaving...' : 'Leave Table'}
          </Button>
        ) : null}

        {room.table.status !== 'in_game' ? (
          <StartGamePanel
            isStarting={startGame.isPending}
            onStart={handleStartGame}
            readyState={readyState}
          />
        ) : null}

        {isCurrentUserSeated ? (
          <ChatPanel
            roomId={room.table.id}
            roomType="table"
            title="Table Chat"
          />
        ) : null}

        {room.table.status === 'in_game' ? (
          <GameCard className="bg-felt-700/35">
            <p className="text-sm font-bold text-cream-50">
              Taking you to the game room...
            </p>
          </GameCard>
        ) : null}
      </div>
    </MobileShell>
  )
}
