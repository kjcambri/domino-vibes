import { DoorOpen } from 'lucide-react'
import { Button } from '../common/Button'
import { DominoImageTile } from '../game/DominoImageTile'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
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
  const isCurrentActiveGame = isCurrentTable && table.status === 'in_game'
  const buttonLabel = isCurrentActiveGame
    ? 'Rejoin Game'
    : isCurrentTable
      ? 'Rejoin Table'
      : getButtonLabel(table.status)
  const fillPercent = Math.round((table.seatedCount / table.maxPlayers) * 100)

  return (
    <GameCard
      className="relative grid gap-4 overflow-hidden p-4"
      variant={isCurrentTable ? 'gold' : 'felt'}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gold-300/8" />
      <div className="relative -mx-4 -mt-4 grid h-28 place-items-center border-b border-cream-100/10 bg-[radial-gradient(circle_at_50%_42%,rgba(69,221,189,0.18),transparent_9rem),linear-gradient(145deg,#146B4A,#061F18)]">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          <DominoImageTile
            className="rotate-[-8deg]"
            orientation="vertical"
            size="tiny"
            tileId="domino-6-4"
          />
          <DominoImageTile
            className="translate-y-1 rotate-[8deg]"
            orientation="vertical"
            size="tiny"
            tileId="domino-2-1"
          />
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="relative min-w-0">
          <GameModeLabel gameMode={table.gameMode} />
          <h2 className="mt-2 text-xl font-black leading-tight text-cream-50">
            {table.name}
          </h2>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      <div className="relative rounded-2xl border border-cream-100/10 bg-green-950/45 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-cream-100/70">Seats</span>
          <span className="text-lg font-black text-cream-50">
            {table.seatedCount}/{table.maxPlayers}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-100/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-300 via-felt-300 to-gold-300"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-cream-100/45">
          Points to Win: 6
        </p>
      </div>

      {isCurrentTable ? (
        <p className="rounded-2xl border border-gold-300/25 bg-gold-300/12 px-4 py-3 text-sm font-bold text-gold-100">
          {isCurrentActiveGame
            ? 'You are in this active game.'
            : 'You are seated here.'}
        </p>
      ) : null}

      {hasOtherCurrentTable ? (
        <p className="rounded-2xl border border-cream-100/10 bg-green-950/35 px-4 py-3 text-sm leading-6 text-cream-100/72">
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
      {!isCurrentTable && table.status === 'waiting' ? (
        <StatusChip className="w-fit" tone="felt">
          Open table
        </StatusChip>
      ) : null}
    </GameCard>
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
