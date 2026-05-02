import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buttonClasses } from '../common/buttonStyles'
import { GameModeLabel } from '../lobby/GameModeLabel'
import { type GameRoomInfo } from '../../features/games/types'

export function GameRoomHeader({ game }: { game: GameRoomInfo }) {
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
      <div>
        <GameModeLabel gameMode={game.gameMode} />
        <h1 className="mt-2 text-3xl font-black leading-tight text-cream-50">
          {game.tableName}
        </h1>
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-gold-200">
          Game status: {game.status} · Round {game.currentRoundNumber} · Move{' '}
          {game.moveCount}
        </p>
      </div>
    </header>
  )
}
