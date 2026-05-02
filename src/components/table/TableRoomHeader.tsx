import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buttonClasses } from '../common/buttonStyles'
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

      <div className="flex items-start justify-between gap-3">
        <div>
          <GameModeLabel gameMode={table.gameMode} />
          <h1 className="mt-2 text-3xl font-black leading-tight text-cream-50">
            {table.name}
          </h1>
        </div>
        <TableStatusBadge status={table.status} />
      </div>
    </header>
  )
}
