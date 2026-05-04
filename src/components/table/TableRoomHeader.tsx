import { Link } from 'react-router-dom'
import { ArrowLeft, UsersRound } from 'lucide-react'
import { buttonClasses } from '../common/buttonStyles'
import { GameCard } from '../ui/GameCard'
import { type TableRoomInfo } from '../../features/tables/types'
import { GameModeLabel } from '../lobby/GameModeLabel'
import { TableStatusBadge } from '../lobby/TableStatusBadge'

export function TableRoomHeader({ table }: { table: TableRoomInfo }) {
  return (
    <header className="grid gap-4">
      <Link
        className={buttonClasses({
          variant: 'ghost',
          className: 'w-fit gap-2 px-2',
        })}
        to="/lobby"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Lobby
      </Link>

      <GameCard className="relative overflow-hidden" variant="wood">
        <div className="absolute -right-12 -top-12 size-36 rounded-full bg-gold-300/12 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <GameModeLabel gameMode={table.gameMode} />
            <h1 className="mt-3 text-3xl font-black leading-tight text-cream-50">
              {table.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-cream-100/70">
              Claim a seat, ready up, and start when all four players are at
              the table.
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold-300/25 bg-gold-300/12 text-gold-100">
            <UsersRound aria-hidden="true" size={21} />
          </span>
        </div>
        <div className="relative mt-4">
          <TableStatusBadge status={table.status} />
        </div>
      </GameCard>
    </header>
  )
}
