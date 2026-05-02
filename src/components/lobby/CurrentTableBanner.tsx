import { ArrowRight, LogOut } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
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

  return (
    <Card className="border-gold-300/30 bg-gold-300/12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            You are currently seated
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-cream-50">
            {currentTable.tableName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <GameModeLabel gameMode={currentTable.gameMode} />
            <span className="text-sm font-bold text-cream-100/70">
              Seat {currentTable.seatNumber}
            </span>
          </div>
        </div>
        <TableStatusBadge status={currentTable.status} />
      </div>

      <div className="mt-5 grid gap-3">
        <Button className="w-full gap-2" onClick={onRejoin}>
          <ArrowRight aria-hidden="true" size={18} />
          {currentTable.status === 'in_game' ? 'Rejoin Game' : 'Rejoin Table'}
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
          <p className="rounded-md border border-cream-100/10 bg-green-950/35 px-4 py-3 text-sm leading-6 text-cream-100/72">
            This table is in game, so leave is unavailable here. Rejoin to continue.
          </p>
        )}
      </div>
    </Card>
  )
}
