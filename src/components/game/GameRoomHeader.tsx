import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'
import { buttonClasses } from '../common/buttonStyles'
import { GameCard } from '../ui/GameCard'
import { StatusChip } from '../ui/StatusChip'
import { GameModeLabel } from '../lobby/GameModeLabel'
import { type GameRoomInfo } from '../../features/games/types'

export function GameRoomHeader({ game }: { game: GameRoomInfo }) {
  return (
    <header className="grid gap-4">
      <Link
        className={buttonClasses({
          variant: 'ghost',
          className: 'w-fit gap-2 px-2 text-cream-100/82',
        })}
        to="/lobby"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Lobby
      </Link>
      <GameCard className="relative overflow-hidden p-4" variant="wood">
        <div className="absolute -right-10 -top-14 size-36 rounded-full bg-gold-300/10 blur-2xl" />
        <div className="absolute left-8 top-0 h-px w-36 bg-gradient-to-r from-transparent via-teal-300/70 to-transparent" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <GameModeLabel gameMode={game.gameMode} />
            <h1 className="mt-2 text-3xl font-black leading-tight text-cream-50">
              {game.tableName}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip tone="gold">Round {game.currentRoundNumber}</StatusChip>
              <StatusChip tone={game.status === 'active' ? 'felt' : 'cream'}>
                {game.status.replace('_', ' ')}
              </StatusChip>
              <StatusChip tone="wood">Move {game.moveCount}</StatusChip>
            </div>
          </div>
          <div className="grid gap-2 rounded-3xl border border-gold-300/20 bg-green-950/50 p-3 shadow-[inset_0_1px_0_rgba(255,244,214,0.08)] sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-gold-300/25 bg-gold-300/12 text-gold-100 shadow-gold">
                <Trophy aria-hidden="true" size={19} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-gold-200">
                  Points to Win
                </p>
                <p className="text-2xl font-black text-cream-50">6</p>
              </div>
            </div>
            <div className="rounded-2xl border border-teal-300/20 bg-teal-300/8 px-3 py-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-300">
                Live table
              </p>
              <p className="mt-1 text-sm font-bold text-cream-100/70">
                Secure hands · Table chat
              </p>
            </div>
          </div>
        </div>
      </GameCard>
    </header>
  )
}
