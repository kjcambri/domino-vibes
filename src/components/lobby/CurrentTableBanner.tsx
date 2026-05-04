import { ArrowRight, LogOut } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import { type CurrentTable } from '../../features/tables/types'
import { GameModeLabel } from './GameModeLabel'
import { TableStatusBadge } from './TableStatusBadge'

type CurrentTableBannerProps = {
  currentTable: CurrentTable
  isLeaving: boolean
  onRejoin: () => void
  onLeave: () => void
}

export function CurrentTableBanner({
  currentTable,
  isLeaving,
  onRejoin,
  onLeave,
}: CurrentTableBannerProps) {
  const canLeave = currentTable.status === 'waiting' || currentTable.status === 'full'
  const isActiveGame = currentTable.status === 'in_game'

  return (
    <GameCard className="relative overflow-hidden border-gold-300/40 bg-gold-300/12" variant="gold">
      <div className="absolute -right-10 -top-12 size-32 rounded-full bg-gold-300/16 blur-2xl" />
      <div className="absolute -left-12 bottom-0 size-28 rounded-full bg-teal-300/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            {isActiveGame ? 'You are in an active game' : 'You are currently seated'}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-cream-50">
            {currentTable.tableName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <GameModeLabel gameMode={currentTable.gameMode} />
            <span className="text-sm font-bold text-cream-100/70">
              Seat {currentTable.seatNumber}
            </span>
            <span className="rounded-full border border-teal-300/30 bg-teal-300/12 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-teal-100">
              Points to Win: 6
            </span>
          </div>
        </div>
        <TableStatusBadge status={currentTable.status} />
      </div>

      <div className="mt-5 grid gap-3">
        <Button className="w-full gap-2" onClick={onRejoin}>
          <ArrowRight aria-hidden="true" size={18} />
          {isActiveGame ? 'Rejoin Game' : 'Rejoin Table'}
        </Button>
        {canLeave ? (
          <Button
            className="w-full gap-2"
            disabled={isLeaving}
            onClick={onLeave}
            variant="danger"
          >
            <LogOut aria-hidden="true" size={18} />
            {isLeaving ? 'Leaving...' : 'Leave Table'}
          </Button>
        ) : (
          <p className="rounded-2xl border border-cream-100/10 bg-green-950/35 px-4 py-3 text-sm leading-6 text-cream-100/72">
            This table is in game, so leave is unavailable here. Rejoin to
            continue.
          </p>
        )}
      </div>
    </GameCard>
  )
}
