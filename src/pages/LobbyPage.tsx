import { type ReactNode, useState } from 'react'
import {
  Crown,
  Eye,
  Home,
  MessageCircle,
  Sparkles,
  Table2,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LogoutButton } from '../components/auth/LogoutButton'
import { SoundToggleButton } from '../components/audio/SoundToggleButton'
import { BetaReadinessCard } from '../components/beta/BetaReadinessCard'
import { ChatPanel } from '../components/chat/ChatPanel'
import { GameCard } from '../components/ui/GameCard'
import { SectionHeader } from '../components/ui/SectionHeader'
import { StateCard } from '../components/ui/StateCard'
import { CurrentTableBanner } from '../components/lobby/CurrentTableBanner'
import { LobbyTableCard } from '../components/lobby/LobbyTableCard'
import { PrivateTablePanel } from '../components/lobby/PrivateTablePanel'
import { MobileShell } from '../components/layout/MobileShell'
import { useLobbyRealtime } from '../features/lobby/useLobbyRealtime'
import { useJoinTable, useLobbyTables } from '../features/lobby/useLobbyTables'
import { useProfile } from '../features/profiles/useProfile'
import { useMyCurrentTable } from '../features/tables/useMyCurrentTable'
import {
  useCreatePrivateTable,
  useJoinPrivateTable,
  useLeaveTable,
} from '../features/tables/useTableRoom'
import { getFriendlyAuthError } from '../lib/errors'

export function LobbyPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const lobbyTables = useLobbyTables()
  const joinTable = useJoinTable()
  const {
    currentTable,
    isCurrentTableLoading,
    currentTableError,
    refetchCurrentTable,
  } = useMyCurrentTable()
  const leaveCurrentTable = useLeaveTable(currentTable?.tableId)
  const createPrivateTable = useCreatePrivateTable()
  const joinPrivateTable = useJoinPrivateTable()
  useLobbyRealtime()

  const playerName = profile?.displayName || profile?.username || 'Player'
  const [logoutError, setLogoutError] = useState('')
  const [tableError, setTableError] = useState('')

  async function handleJoinTable(tableId: string) {
    setTableError('')

    try {
      const result = await joinTable.mutateAsync(tableId)
      navigate(`/tables/${result.tableId}`)
    } catch (caughtError) {
      setTableError(getFriendlyAuthError(caughtError))
    }
  }

  function handleRejoinCurrentTable() {
    if (!currentTable) {
      return
    }

    if (currentTable.status === 'in_game' && currentTable.currentGameId) {
      navigate(`/games/${currentTable.currentGameId}`)
      return
    }

    if (currentTable.status === 'in_game') {
      setTableError(getFriendlyAuthError(new Error('failed_to_rejoin_game')))
      return
    }

    navigate(`/tables/${currentTable.tableId}`)
  }

  function handleRejoinTable(tableId: string) {
    if (
      currentTable?.tableId === tableId &&
      currentTable.status === 'in_game' &&
      currentTable.currentGameId
    ) {
      navigate(`/games/${currentTable.currentGameId}`)
      return
    }

    if (currentTable?.tableId === tableId && currentTable.status === 'in_game') {
      setTableError(getFriendlyAuthError(new Error('failed_to_rejoin_game')))
      return
    }

    navigate(`/tables/${tableId}`)
  }

  async function handleLeaveCurrentTable() {
    if (!currentTable) {
      return
    }

    setTableError('')

    try {
      await leaveCurrentTable.mutateAsync()
      await Promise.all([lobbyTables.refetch(), refetchCurrentTable()])
    } catch (caughtError) {
      setTableError(getFriendlyAuthError(caughtError))
    }
  }

  async function handleCreatePrivateTable(tableName?: string) {
    setTableError('')

    try {
      const result = await createPrivateTable.mutateAsync(tableName)
      navigate(`/tables/${result.tableId}`)
    } catch (caughtError) {
      setTableError(getFriendlyAuthError(caughtError))
    }
  }

  async function handleJoinPrivateTable(inviteCode: string) {
    setTableError('')

    try {
      const result = await joinPrivateTable.mutateAsync(inviteCode)
      navigate(`/tables/${result.tableId}`)
    } catch (caughtError) {
      setTableError(getFriendlyAuthError(caughtError))
    }
  }

  return (
    <MobileShell className="max-w-7xl">
      <div className="flex flex-1 flex-col gap-5 py-4">
        <GameCard className="relative overflow-hidden border-gold-300/22" variant="wood">
          <div className="absolute -right-16 -top-16 size-44 rounded-full bg-gold-300/14 blur-3xl" />
          <div className="absolute left-8 top-0 h-px w-40 bg-gradient-to-r from-transparent via-teal-300/70 to-transparent" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill icon={<Crown size={14} />} label="Domino Vibes Lobby" />
                <StatusPill icon={<Sparkles size={14} />} label="Private beta live" tone="teal" />
              </div>
              <SoundToggleButton />
            </div>
            <h1 className="mt-4 font-serif text-4xl font-black leading-tight text-cream-50 md:text-5xl">
              Welcome back, {playerName}.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-cream-100/78">
              Choose your table, keep the room talking, and jump back into
              live Cutthroat 4 whenever the club calls.
            </p>
          </div>
          {logoutError || tableError ? (
            <div
              className="relative mt-5 rounded-2xl border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
              role="alert"
            >
              {logoutError || tableError}
            </div>
          ) : null}
          <LogoutButton
            className="mt-6 w-full gap-2"
            onError={setLogoutError}
          />
        </GameCard>

        {isCurrentTableLoading ? (
          <StateCard title="Checking your table seat..." type="loading" />
        ) : null}

        {currentTableError ? (
          <StateCard
            copy={getFriendlyAuthError(currentTableError)}
            title="Could not check your current table."
            type="error"
          />
        ) : null}

        {currentTable ? (
          <CurrentTableBanner
            currentTable={currentTable}
            isLeaving={leaveCurrentTable.isPending}
            onLeave={handleLeaveCurrentTable}
            onRejoin={handleRejoinCurrentTable}
          />
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
          <ClubLobbyRail />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <section className="grid gap-3">
              <SectionHeader
                copy="System Cutthroat 4 tables are live now. Future private and ranked rooms stay clearly marked until playable."
                eyebrow="Club tables"
                title="Choose your table"
              />

              {lobbyTables.isLoading ? (
                <StateCard
                  copy="Pulling the latest seats from Domino Vibes."
                  title="Loading tables..."
                  type="loading"
                />
              ) : null}

              {lobbyTables.isError ? (
                <StateCard
                  copy={getFriendlyAuthError(lobbyTables.error)}
                  title="Could not load tables."
                  type="error"
                />
              ) : null}

              {lobbyTables.data?.length === 0 ? (
                <StateCard
                  copy="System-created tables will appear here when available."
                  title="No tables are open."
                  type="empty"
                />
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {lobbyTables.data?.map((table) => (
                  <LobbyTableCard
                    hasOtherCurrentTable={
                      Boolean(currentTable) && currentTable?.tableId !== table.id
                    }
                    isJoining={joinTable.isPending && joinTable.variables === table.id}
                    isCurrentTable={currentTable?.tableId === table.id}
                    key={table.id}
                    onJoin={handleJoinTable}
                    onRejoin={handleRejoinTable}
                    table={table}
                  />
                ))}
              </div>

              <PrivateTablePanel
                isCreating={createPrivateTable.isPending}
                isJoining={joinPrivateTable.isPending}
                onCreate={handleCreatePrivateTable}
                onJoin={handleJoinPrivateTable}
              />

              <div className="grid gap-3 md:grid-cols-3">
                <FutureModeCard label="Ranked Matches" />
                <FutureModeCard label="Community Tournaments" />
                <FutureModeCard label="Clubs" />
              </div>
            </section>

            <aside className="grid gap-4 xl:sticky xl:top-4">
              <GameCard className="p-4" variant="felt">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl border border-teal-300/30 bg-teal-300/12 text-teal-100 shadow-teal">
                    <UsersRound aria-hidden="true" size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
                      Club lounge
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream-100/75">
                      Say hello before you sit.
                    </p>
                  </div>
                </div>
              </GameCard>
              <BetaReadinessCard
                className="p-4"
                compact
                source="Lobby beta readiness"
              />
              <ChatPanel
                defaultOpen
                roomType="lobby"
                title="Lobby Chat"
              />
            </aside>
          </div>
        </div>
      </div>
    </MobileShell>
  )
}

function ClubLobbyRail() {
  return (
    <aside className="grid gap-3 xl:sticky xl:top-4">
      <GameCard className="p-4" variant="wood">
        <p className="text-2xl font-black text-gold-200">Domino Vibes</p>
        <p className="mt-1 text-sm font-bold text-cream-100/72">
          Elite Social Club
        </p>
      </GameCard>
      <nav
        aria-label="Club sections"
        className="grid gap-2 rounded-2xl border border-gold-300/16 bg-wood-900/50 p-2 shadow-wood"
      >
        <ClubRailItem icon={<Home size={17} />} label="Home" to="/" />
        <ClubRailItem active icon={<Table2 size={17} />} label="Play" to="/lobby" />
        <ClubRailItem icon={<UserRound size={17} />} label="Profile" to="/profile" />
        <ClubRailItem comingSoon icon={<Eye size={17} />} label="Watch" />
        <ClubRailItem comingSoon icon={<UsersRound size={17} />} label="Clubs" />
        <ClubRailItem comingSoon icon={<Trophy size={17} />} label="Leaderboards" />
      </nav>
    </aside>
  )
}

function ClubRailItem({
  active = false,
  comingSoon = false,
  icon,
  label,
  to,
}: {
  active?: boolean
  comingSoon?: boolean
  icon: ReactNode
  label: string
  to?: string
}) {
  const className = active
    ? 'flex min-h-11 items-center justify-between gap-3 rounded-xl border border-gold-300/24 bg-gold-300/12 px-3 text-sm font-black text-gold-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950'
    : 'flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-black text-cream-100/58 transition hover:bg-cream-100/8 hover:text-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950'
  const content = (
    <>
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      {comingSoon ? (
        <span className="rounded-full border border-cream-100/10 px-2 py-1 text-[0.55rem] uppercase tracking-[0.12em] text-cream-100/45">
          Soon
        </span>
      ) : null}
    </>
  )

  if (to && !comingSoon) {
    return (
      <Link aria-current={active ? 'page' : undefined} className={className} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <div
      aria-disabled={comingSoon || undefined}
      className={className}
    >
      {content}
    </div>
  )
}

function StatusPill({
  icon,
  label,
  tone = 'gold',
}: {
  icon: ReactNode
  label: string
  tone?: 'gold' | 'teal'
}) {
  return (
    <span
      className={
        tone === 'teal'
          ? 'inline-flex items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-teal-100'
          : 'inline-flex items-center gap-2 rounded-full border border-gold-300/35 bg-gold-300/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-gold-100'
      }
    >
      {icon}
      {label}
    </span>
  )
}

function FutureModeCard({ label }: { label: string }) {
  return (
    <GameCard className="p-4 opacity-[0.86]" variant="felt">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
            Coming soon
          </p>
          <h3 className="mt-2 text-lg font-black text-cream-50">{label}</h3>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl border border-cream-100/10 bg-green-950/45 text-gold-100">
          <MessageCircle aria-hidden="true" size={17} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-cream-100/60">
        Preview only. Not playable yet.
      </p>
    </GameCard>
  )
}
