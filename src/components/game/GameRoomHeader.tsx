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
        <div className="relative flex items-start justify-between gap-3">
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
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold-300/25 bg-gold-300/12 text-gold-100 shadow-gold">
            <Trophy aria-hidden="true" size={20} />
          </span>
        </div>
      </GameCard>
    </header>
  )
}
