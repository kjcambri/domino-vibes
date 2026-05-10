import {
  ArrowLeft,
  Eye,
  Home,
  ShieldCheck,
  Table2,
  UsersRound,
} from 'lucide-react'
import { type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BoardStatePreview } from '../components/game/BoardStatePreview'
import { GamePlayerList } from '../components/game/GamePlayerList'
import { MobileShell } from '../components/layout/MobileShell'
import { buttonClasses } from '../components/common/buttonStyles'
import { GameCard } from '../components/ui/GameCard'
import { StateCard } from '../components/ui/StateCard'
import { useSpectatorGameRoom } from '../features/friends/useFriendsHub'
import { getFriendlyFriendsError } from '../features/friends/friendsUtils'

export function SpectatorGamePage() {
  const { gameId } = useParams()
  const spectatorRoom = useSpectatorGameRoom(gameId)

  if (spectatorRoom.isLoading) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <StateCard
            copy="Loading the public board state for this friend game."
            title="Opening spectator view..."
            type="loading"
          />
        </div>
      </MobileShell>
    )
  }

  if (spectatorRoom.isError || !spectatorRoom.data) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <StateCard
            copy={getFriendlyFriendsError(spectatorRoom.error)}
            title="Could not spectate this game."
            type="error"
          />
        </div>
      </MobileShell>
    )
  }

  const { game, players } = spectatorRoom.data

  return (
    <MobileShell className="max-w-[1500px]">
      <div className="flex flex-1 flex-col gap-4 py-4">
        <header className="rounded-3xl border border-gold-300/22 bg-[linear-gradient(120deg,rgba(42,22,10,0.96),rgba(11,61,46,0.86),rgba(42,22,10,0.88))] p-4 shadow-wood md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-300">
                <Eye aria-hidden="true" size={15} />
                Spectator Preview
              </p>
              <h1 className="mt-2 truncate font-serif text-3xl font-black text-cream-50 md:text-4xl">
                {game.tableName}
              </h1>
              <p className="mt-2 text-sm font-semibold text-cream-100/70">
                Round {game.currentRoundNumber} · {game.moveCount} moves · Points to Win: 6
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonClasses({
                  className: 'min-h-10 gap-2 px-4 py-2',
                  variant: 'secondary',
                })}
                to="/friends"
              >
                <ArrowLeft aria-hidden="true" size={16} />
                Friends
              </Link>
              <Link
                className={buttonClasses({
                  className: 'min-h-10 gap-2 px-4 py-2',
                  variant: 'secondary',
                })}
                to="/lobby"
              >
                <Home aria-hidden="true" size={16} />
                Lobby
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px] xl:items-start">
          <aside className="order-3 grid gap-4 xl:order-1 xl:sticky xl:top-4">
            <GamePlayerList
              currentTurnPlayerId={game.currentTurnPlayerId}
              players={players}
            />
          </aside>

          <div className="order-1 min-w-0 xl:order-2">
            <BoardStatePreview boardState={game.boardState} />
          </div>

          <aside className="order-2 grid gap-4 xl:order-3 xl:sticky xl:top-4">
            <GameCard className="p-4" variant="felt">
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-xl border border-teal-300/30 bg-teal-300/12 text-teal-100 shadow-teal">
                  <ShieldCheck aria-hidden="true" size={19} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
                    Read-only
                  </p>
                  <p className="mt-1 text-sm leading-6 text-cream-100/72">
                    Spectating shows the public board, open ends, scores, and
                    hand counts only. Hidden hands, table chat, and turn actions
                    stay private to seated players.
                  </p>
                </div>
              </div>
            </GameCard>

            <GameCard className="p-4" variant="wood">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gold-200">
                Game Info
              </p>
              <div className="mt-3 grid gap-3 text-sm font-semibold text-cream-100/72">
                <InfoRow icon={<Table2 size={16} />} label="Mode" value="Cutthroat 4" />
                <InfoRow icon={<UsersRound size={16} />} label="Players" value={`${players.length}`} />
                <InfoRow icon={<Eye size={16} />} label="Status" value={game.status} />
              </div>
            </GameCard>
          </aside>
        </div>
      </div>
    </MobileShell>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-cream-100/10 bg-green-950/38 px-3 py-2">
      <span className="flex items-center gap-2 text-cream-100/62">
        {icon}
        {label}
      </span>
      <span className="font-black text-cream-50">{value}</span>
    </div>
  )
}
