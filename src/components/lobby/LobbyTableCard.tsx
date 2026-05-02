import { DoorOpen } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { type LobbyTable } from '../../features/lobby/types'
import { GameModeLabel } from './GameModeLabel'
import { TableStatusBadge } from './TableStatusBadge'

type LobbyTableCardProps = {
  table: LobbyTable
  isJoining: boolean
  isCurrentTable?: boolean
  hasOtherCurrentTable?: boolean
  onJoin: (tableId: string) => void
  onRejoin: (tableId: string) => void
}

export function LobbyTableCard({
  table,
  isJoining,
  isCurrentTable = false,
  hasOtherCurrentTable = false,
  onJoin,
  onRejoin,
}: LobbyTableCardProps) {
  const canJoin = table.status === 'waiting' && !hasOtherCurrentTable
  const buttonLabel = isCurrentTable ? 'Rejoin Table' : getButtonLabel(table.status)

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <GameModeLabel gameMode={table.gameMode} />
          <h2 className="mt-2 text-xl font-black leading-tight text-cream-50">
            {table.name}
          </h2>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-cream-100/10 bg-green-950/45 px-4 py-3">
        <span className="text-sm font-bold text-cream-100/70">Seats</span>
        <span className="text-lg font-black text-cream-50">
          {table.seatedCount}/{table.maxPlayers}
        </span>
      </div>

      {isCurrentTable ? (
        <p className="rounded-md border border-gold-300/25 bg-gold-300/12 px-4 py-3 text-sm font-bold text-gold-100">
          You are seated here.
        </p>
      ) : null}

      {hasOtherCurrentTable ? (
        <p className="rounded-md border border-cream-100/10 bg-green-950/35 px-4 py-3 text-sm leading-6 text-cream-100/72">
          Leave your current table before joining another.
        </p>
      ) : null}

      <Button
        className="w-full gap-2"
        disabled={(!canJoin && !isCurrentTable) || isJoining}
        onClick={() => (isCurrentTable ? onRejoin(table.id) : onJoin(table.id))}
        variant={canJoin || isCurrentTable ? 'primary' : 'secondary'}
      >
        <DoorOpen aria-hidden="true" size={18} />
        {isJoining && canJoin ? 'Joining...' : buttonLabel}
      </Button>
    </Card>
  )
}

function getButtonLabel(status: LobbyTable['status']) {
  if (status === 'waiting') {
    return 'Join Table'
  }

  if (status === 'full') {
    return 'Full'
  }

  if (status === 'in_game') {
    return 'In Game'
  }

  return 'Unavailable'
}
