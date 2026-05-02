import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { MobileShell } from '../components/layout/MobileShell'
import { TableRoomHeader } from '../components/table/TableRoomHeader'
import { TableSeatGrid } from '../components/table/TableSeatGrid'
import { useAuth } from '../features/auth/useAuth'
import { useTableRealtime } from '../features/tables/useTableRealtime'
import {
  useLeaveTable,
  useSitAtTable,
  useTableRoom,
} from '../features/tables/useTableRoom'
import { getFriendlyAuthError } from '../lib/errors'

export function TableRoomPage() {
  const navigate = useNavigate()
  const { tableId } = useParams()
  const { user } = useAuth()
  const tableRoom = useTableRoom(tableId)
  const sitAtTable = useSitAtTable(tableId)
  const leaveTable = useLeaveTable(tableId)
  const [error, setError] = useState('')
  useTableRealtime(tableId)

  const room = tableRoom.data
  const isCurrentUserSeated = Boolean(
    room?.seats.some((seat) => seat.playerId === user?.id),
  )
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

  if (tableRoom.isLoading) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <Card>
            <p className="text-sm font-bold text-cream-50">Loading table...</p>
            <p className="mt-2 text-sm leading-6 text-cream-100/70">
              Syncing seats and table status.
            </p>
          </Card>
        </div>
      </MobileShell>
    )
  }

  if (tableRoom.isError || !room) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <Card className="border-red-300/30 bg-red-800/20">
            <p className="text-sm font-bold text-red-100">
              Could not open table.
            </p>
            <p className="mt-2 text-sm leading-6 text-red-100/80">
              {getFriendlyAuthError(tableRoom.error)}
            </p>
          </Card>
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 py-4">
        <TableRoomHeader table={room.table} />

        {error ? (
          <div
            className="rounded-md border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <TableSeatGrid
          canSit={canSit}
          isBusy={sitAtTable.isPending}
          onSit={handleSit}
          seats={room.seats}
        />

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

        {room.table.status === 'full' ? (
          <Card className="bg-felt-700/35">
            <p className="text-sm font-bold text-cream-50">
              Ready system arrives in Sprint 4.
            </p>
          </Card>
        ) : null}

        {room.table.status === 'in_game' ? (
          <Card className="bg-felt-700/35">
            <p className="text-sm font-bold text-cream-50">
              Game room arrives later.
            </p>
          </Card>
        ) : null}
      </div>
    </MobileShell>
  )
}
