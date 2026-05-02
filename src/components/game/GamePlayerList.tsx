import { UserRound } from 'lucide-react'
import { Card } from '../common/Card'
import { type GameRoomPlayer } from '../../features/games/types'

export function GamePlayerList({ players }: { players: GameRoomPlayer[] }) {
  return (
    <section className="grid gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Players
      </p>
      {players.map((player) => (
        <Card className="flex items-center gap-3 p-4" key={player.seatNumber}>
          <span className="grid size-10 place-items-center rounded-md border border-cream-100/12 bg-green-950/45 text-cream-100">
            <UserRound aria-hidden="true" size={18} />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-200">
              Seat {player.seatNumber}
            </p>
            <p className="mt-1 font-black text-cream-50">
              {player.displayName || player.username || 'Open seat'}
            </p>
            <p className="mt-1 text-sm text-cream-100/65">
              {player.handCount} tiles · Score {player.score}
            </p>
          </div>
        </Card>
      ))}
    </section>
  )
}
