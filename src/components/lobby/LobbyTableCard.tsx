import { DoorOpen, Eye, UserRound, UsersRound, Zap } from 'lucide-react'
import { Button } from '../common/Button'
import { DominoImageTile } from '../game/DominoImageTile'
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
  const emptySeatCount = Math.max(table.maxPlayers - table.seatedCount, 0)

  return (
    <article
      className={
        isCurrentTable
          ? 'relative min-w-0 overflow-hidden rounded-xl bg-[linear-gradient(45deg,#fbbf24,#78350f,#fbbf24)] p-px shadow-[0_18px_44px_rgba(249,189,34,0.22)]'
          : 'relative min-w-0 overflow-hidden rounded-xl bg-[linear-gradient(45deg,rgba(249,189,34,0.82),rgba(120,53,15,0.72))] p-px shadow-[0_18px_44px_rgba(0,0,0,0.34)]'
      }
    >
      <div className="relative grid h-full gap-4 rounded-[0.72rem] border border-cream-100/8 bg-[repeating-linear-gradient(90deg,rgba(255,244,214,0.035)_0_1px,transparent_1px_22px),radial-gradient(circle_at_84%_0%,rgba(249,189,34,0.12),transparent_12rem),linear-gradient(145deg,#2f291f,#241f15_48%,#082d22)] p-4">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gold-300/8" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <GameModeLabel gameMode={table.gameMode} />
            <h2 className="mt-2 truncate font-serif text-xl font-black leading-tight text-cream-50">
              {table.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#17130a]/72 px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.1em] text-gold-100">
                <Zap aria-hidden="true" size={12} />
                Points to Win: 6
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-[#17130a]/72 px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.1em] text-cream-100/62">
                <UsersRound aria-hidden="true" size={12} />
                Cutthroat 4
              </span>
            </div>
          </div>
          <TableStatusBadge status={table.status} />
        </div>

        <div className="relative -mx-4 grid min-h-28 place-items-center border-y border-cream-100/10 bg-[radial-gradient(circle_at_50%_42%,rgba(69,221,189,0.2),transparent_9rem),linear-gradient(145deg,#064e3b,#061f18)] px-4 py-4 shadow-[inset_0_0_38px_rgba(0,0,0,0.38)]">
          <div aria-hidden="true" className="flex items-center justify-center gap-1.5">
            <DominoImageTile
              className="-rotate-90"
              orientation="vertical"
              size="tiny"
              tileId="domino-6-4"
            />
            <DominoImageTile
              className="-rotate-90"
              orientation="vertical"
              size="tiny"
              tileId="domino-4-2"
            />
            <DominoImageTile
              className="rotate-0"
              orientation="vertical"
              size="tiny"
              tileId="domino-2-1"
            />
          </div>
        </div>

        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cream-100/42">
              Seats
            </p>
            <div className="mt-2 flex -space-x-2">
              {Array.from({ length: table.seatedCount }).map((_, index) => (
                <span
                  className="grid size-9 place-items-center rounded-full border-2 border-[#241f15] bg-[linear-gradient(145deg,#29a195,#064e3b)] text-cream-50 shadow-[0_8px_18px_rgba(0,0,0,0.24)]"
                  key={`seated-${table.id}-${index}`}
                >
                  <UserRound aria-hidden="true" size={15} />
                </span>
              ))}
              {Array.from({ length: emptySeatCount }).map((_, index) => (
                <span
                  className="grid size-9 place-items-center rounded-full border-2 border-[#241f15] bg-[#3a3429] text-[#9c8f79]"
                  key={`empty-${table.id}-${index}`}
                >
                  <UserRound aria-hidden="true" size={15} />
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-14 shrink-0 rounded-full border border-outline/40 bg-[#17130a]/70 px-3 py-1.5 text-center text-sm font-black text-cream-50">
            {table.seatedCount}/{table.maxPlayers}
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-cream-100/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#29a195] via-[#6bd8cb] to-[#fbbf24]"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {isCurrentTable ? (
          <p className="rounded-lg border border-gold-300/25 bg-gold-300/12 px-3 py-2 text-sm font-bold text-gold-100">
            {isCurrentActiveGame
              ? 'You are in this active game.'
              : 'You are seated here.'}
          </p>
        ) : null}

        {hasOtherCurrentTable ? (
          <p className="rounded-lg border border-cream-100/10 bg-[#17130a]/55 px-3 py-2 text-sm leading-6 text-cream-100/68">
            Leave your current table before joining another.
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2 rounded-lg"
            disabled={(!canJoin && !isCurrentTable) || isJoining}
            onClick={() => (isCurrentTable ? onRejoin(table.id) : onJoin(table.id))}
            variant={canJoin || isCurrentTable ? 'primary' : 'secondary'}
          >
            <DoorOpen aria-hidden="true" size={18} />
            {isJoining && canJoin ? 'Joining...' : buttonLabel}
          </Button>
          <button
            aria-label={`${table.name} preview coming soon`}
            className="grid min-h-12 w-14 place-items-center rounded-lg border border-gold-300/28 bg-[#17130a]/40 text-gold-100 opacity-70"
            disabled
            type="button"
          >
            <Eye aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
    </article>
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
