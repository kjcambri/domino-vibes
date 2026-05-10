import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Crown,
  Eye,
  Home,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trophy,
  UserRound,
  UsersRound,
  Volume2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LogoutButton } from '../components/auth/LogoutButton'
import { SoundToggleButton } from '../components/audio/SoundToggleButton'
import { BetaReadinessCard } from '../components/beta/BetaReadinessCard'
import { ChatPanel } from '../components/chat/ChatPanel'
import { CurrentTableBanner } from '../components/lobby/CurrentTableBanner'
import { LobbyTableCard } from '../components/lobby/LobbyTableCard'
import { StateCard } from '../components/ui/StateCard'
import { useLobbyRealtime } from '../features/lobby/useLobbyRealtime'
import { useJoinTable, useLobbyTables } from '../features/lobby/useLobbyTables'
import { useProfile } from '../features/profiles/useProfile'
import { useMyCurrentTable } from '../features/tables/useMyCurrentTable'
import { useLeaveTable } from '../features/tables/useTableRoom'
import { appInfo } from '../lib/appInfo'
import { getFriendlyAuthError } from '../lib/errors'

const modeChips = [
  { label: 'Cutthroat 4', active: true },
  { label: 'Partners', comingSoon: true },
  { label: 'Cuban', comingSoon: true },
  { label: 'All Fives', comingSoon: true },
  { label: 'Block', comingSoon: true },
  { label: 'Ranked', comingSoon: true, featured: true },
  { label: 'Private', comingSoon: true },
]

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
  useLobbyRealtime()

  const playerName = profile?.displayName || profile?.username || 'Player'
  const avatarUrl = profile?.avatarUrl
  const [logoutError, setLogoutError] = useState('')
  const [tableError, setTableError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [openSeatsOnly, setOpenSeatsOnly] = useState(false)
  const isDesktopChat = useMediaQuery('(min-width: 1280px)')
  const filteredTables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return (lobbyTables.data ?? []).filter((table) => {
      const matchesSearch = query ? table.name.toLowerCase().includes(query) : true
      const matchesOpenSeats = openSeatsOnly
        ? table.status === 'waiting' && table.seatedCount < table.maxPlayers
        : true

      return matchesSearch && matchesOpenSeats
    })
  }, [lobbyTables.data, openSeatsOnly, searchQuery])

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

  return (
    <div className="min-h-svh overflow-hidden bg-[#17130a] text-[#ece1d1]">
      <DesktopClubRail onLogoutError={setLogoutError} />

      <div className="min-h-svh lg:ml-64">
        <LobbyTopBar
          avatarUrl={avatarUrl}
          onSearch={setSearchQuery}
          playerName={playerName}
          searchQuery={searchQuery}
        />

        <main className="flex min-h-[calc(100svh-4rem)] bg-[radial-gradient(circle_at_50%_28%,rgba(41,161,149,0.18),transparent_26rem),repeating-linear-gradient(135deg,rgba(236,225,209,0.035)_0_1px,transparent_1px_42px),linear-gradient(145deg,#064e3b,#082d22_48%,#061f18)] pt-16 shadow-[inset_0_0_60px_rgba(0,0,0,0.48)]">
          <section className="min-w-0 flex-1 overflow-y-auto pb-28 lg:pb-8">
            <LobbyControlDeck
              onOpenSeatsChange={setOpenSeatsOnly}
              openSeatsOnly={openSeatsOnly}
              playerName={playerName}
            />

            <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
              {logoutError || tableError ? (
                <div
                  className="rounded-xl border border-red-300/30 bg-red-950/35 px-4 py-3 text-sm leading-6 text-red-100"
                  role="alert"
                >
                  {logoutError || tableError}
                </div>
              ) : null}

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

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6bd8cb]">
                    Club tables
                  </p>
                  <h1 className="mt-2 font-serif text-3xl font-black text-[#ffdf9f] md:text-4xl">
                    Choose your Cutthroat 4 table
                  </h1>
                </div>
                <p className="hidden rounded-full border border-[#4f4633] bg-[#241f15]/88 px-4 py-2 text-sm font-black text-[#d3c5ac] md:block">
                  {filteredTables.length} shown
                </p>
              </div>

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

              {!lobbyTables.isLoading && filteredTables.length === 0 ? (
                <StateCard
                  copy="Try clearing the search or open-seat filter."
                  title="No matching tables."
                  type="empty"
                />
              ) : null}

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {filteredTables.map((table) => (
                  <LobbyTableCard
                    hasOtherCurrentTable={
                      Boolean(currentTable) && currentTable?.tableId !== table.id
                    }
                    isCurrentTable={currentTable?.tableId === table.id}
                    isJoining={joinTable.isPending && joinTable.variables === table.id}
                    key={table.id}
                    onJoin={handleJoinTable}
                    onRejoin={handleRejoinTable}
                    table={table}
                  />
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <FutureModeCard label="Ranked" />
                <FutureModeCard label="Community Tournaments" />
                <FutureModeCard label="Private Tables" />
              </div>

              <div className="grid gap-4 xl:hidden">
                <BetaReadinessCard compact source="Lobby beta readiness" />
                {!isDesktopChat ? (
                  <ChatPanel defaultOpen roomType="lobby" title="Lobby Chat" />
                ) : null}
              </div>
            </div>
          </section>

          <aside className="hidden w-80 shrink-0 flex-col border-l-2 border-[#f9bd22] bg-[#241f15] shadow-[-18px_0_44px_rgba(0,0,0,0.38)] xl:flex">
            <div className="border-b border-[#4f4633] bg-[#2f291f] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-serif text-xl font-black text-[#ffdf9f]">
                  <MessageCircle aria-hidden="true" className="text-[#29a195]" size={20} />
                  Lobby Chatter
                </h2>
                <span className="rounded-full bg-[#17130a] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#d3c5ac]">
                  Beta live
                </span>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
              <BetaReadinessCard compact source="Lobby beta readiness" />
              {isDesktopChat ? (
                <ChatPanel defaultOpen roomType="lobby" title="Lobby Chat" />
              ) : null}
            </div>
          </aside>
        </main>
      </div>

      <MobileBottomNav />
      <div className="fixed bottom-[4.8rem] left-0 z-40 flex w-full justify-center px-4 xl:hidden">
        <div className="rounded-t-xl border-x border-t border-[#4f4633] bg-[#2f291f]/95 px-4 pb-3 pt-2 text-xs font-bold text-[#d3c5ac] shadow-2xl backdrop-blur">
          <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-[#9c8f79]" />
          Lobby Chat below tables
        </div>
      </div>
    </div>
  )
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const updateMatches = () => setMatches(mediaQuery.matches)

    updateMatches()
    mediaQuery.addEventListener('change', updateMatches)

    return () => mediaQuery.removeEventListener('change', updateMatches)
  }, [query])

  return matches
}

function LobbyTopBar({
  avatarUrl,
  onSearch,
  playerName,
  searchQuery,
}: {
  avatarUrl?: string | null
  onSearch: (value: string) => void
  playerName: string
  searchQuery: string
}) {
  return (
    <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#4f4633] bg-[#2f291f]/96 px-4 shadow-md backdrop-blur lg:left-64 lg:w-[calc(100%-16rem)]">
      <button
        aria-label="Search tables"
        className="grid size-10 place-items-center rounded-full text-[#d3c5ac] transition hover:bg-[#3f382d] hover:text-[#ffdf9f] md:hidden"
        type="button"
      >
        <Search aria-hidden="true" size={20} />
      </button>
      <Link
        className="font-serif text-2xl font-black leading-tight text-[#fbbf24] lg:hidden"
        to="/"
      >
        Domino Vibes
      </Link>
      <div className="relative hidden md:block">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8f79]"
          size={18}
        />
        <input
          className="h-10 w-72 rounded-full border border-[#4f4633] bg-[#241f15] pl-10 pr-4 text-sm font-bold text-[#ece1d1] outline-none transition placeholder:text-[#9c8f79] focus:border-[#29a195] focus:ring-2 focus:ring-[#29a195]/20"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search tables..."
          type="search"
          value={searchQuery}
        />
      </div>
      <div className="flex items-center gap-2">
        <TopIconButton icon={<Bell size={19} />} label="Notifications coming soon" />
        <TopIconButton icon={<UsersRound size={19} />} label="Friends coming soon" />
        <TopIconButton icon={<Volume2 size={19} />} label="Sound settings">
          <SoundToggleButton />
        </TopIconButton>
        <Link
          aria-label={`${playerName} profile`}
          className="grid size-9 place-items-center overflow-hidden rounded-full border border-[#fbbf24] bg-[#241f15] text-[#ffdf9f]"
          to="/profile"
        >
          {avatarUrl ? (
            <img
              alt=""
              className="h-full w-full object-cover"
              src={avatarUrl}
            />
          ) : (
            <UserRound aria-hidden="true" size={18} />
          )}
        </Link>
      </div>
    </header>
  )
}

function TopIconButton({
  children,
  icon,
  label,
}: {
  children?: ReactNode
  icon: ReactNode
  label: string
}) {
  if (children) {
    return <div className="hidden md:block">{children}</div>
  }

  return (
    <button
      aria-label={label}
      className="hidden size-10 place-items-center rounded-full text-[#d3c5ac] transition hover:bg-[#3f382d] hover:text-[#ffdf9f] md:grid"
      disabled
      type="button"
    >
      {icon}
    </button>
  )
}

function LobbyControlDeck({
  onOpenSeatsChange,
  openSeatsOnly,
  playerName,
}: {
  onOpenSeatsChange: (value: boolean) => void
  openSeatsOnly: boolean
  playerName: string
}) {
  return (
    <div className="border-b border-[#4f4633] bg-[repeating-linear-gradient(45deg,rgba(255,244,214,0.03)_0_1px,transparent_1px_18px),linear-gradient(145deg,#3a3429,#241f15)] px-4 py-5 shadow-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6bd8cb]">
              Elite Social Club
            </p>
            <h1 className="mt-2 font-serif text-3xl font-black leading-tight text-[#ffdf9f] md:text-4xl">
              Welcome back, {playerName}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#d3c5ac]">
              Join a live Domino Vibes system table, keep the lobby talking,
              and chase bragging rights in Cutthroat 4.
            </p>
          </div>
          <div className="hidden md:block">
            <LogoutButton className="gap-2 rounded-lg" onError={() => undefined} />
          </div>
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {modeChips.map((chip) => (
            <button
              className={
                chip.active
                  ? 'shrink-0 rounded-full border border-transparent bg-[#fbbf24] px-5 py-2 text-sm font-black text-[#402d00] shadow-[0_10px_24px_rgba(249,189,34,0.2)]'
                  : chip.featured
                    ? 'shrink-0 rounded-full border border-[#fbbf24]/35 bg-[#241f15] px-5 py-2 text-sm font-black text-[#ffdf9f] opacity-75'
                    : 'shrink-0 rounded-full border border-[#4f4633] bg-[#241f15] px-5 py-2 text-sm font-black text-[#d3c5ac] opacity-75'
              }
              disabled={!chip.active}
              key={chip.label}
              type="button"
            >
              {chip.label}
              {chip.comingSoon ? (
                <span className="ml-2 text-[0.6rem] uppercase tracking-[0.12em] opacity-65">
                  Soon
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Region: Caribbean" />
          <FilterSelect label="Skill: Open Table" />
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#4f4633] bg-[#241f15] px-3 text-sm font-bold text-[#d3c5ac] transition hover:border-[#29a195]/55 hover:text-[#ece1d1]">
            <input
              checked={openSeatsOnly}
              className="size-4 accent-[#29a195]"
              onChange={(event) => onOpenSeatsChange(event.target.checked)}
              type="checkbox"
            />
            Open Seats
          </label>
          <DisabledFilter icon={<Sparkles size={15} />} label="Friends Playing" />
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label }: { label: string }) {
  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#4f4633] bg-[#241f15] px-3 text-sm font-bold text-[#d3c5ac]"
      type="button"
    >
      <SlidersHorizontal aria-hidden="true" size={15} />
      {label}
    </button>
  )
}

function DisabledFilter({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#4f4633] bg-[#241f15] px-3 text-sm font-bold text-[#9c8f79] opacity-70"
      disabled
      type="button"
    >
      {icon}
      {label}
      <span className="rounded-full border border-[#4f4633] px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.12em]">
        Soon
      </span>
    </button>
  )
}

function DesktopClubRail({ onLogoutError }: { onLogoutError: (message: string) => void }) {
  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[#4f4633] bg-[#241f15] pt-16 shadow-xl lg:flex">
      <div className="px-6 py-6">
        <p className="font-serif text-2xl font-black leading-tight text-[#fbbf24]">
          Domino Vibes
        </p>
        <p className="mt-1 text-sm font-bold text-[#d3c5ac]">Elite Social Club</p>
      </div>
      <ul className="flex-1 space-y-1 px-2">
        <RailItem icon={<Home size={20} />} label="Home" to="/" />
        <RailItem active icon={<Table2 size={20} />} label="Play" to="/lobby" />
        <RailItem comingSoon icon={<Eye size={20} />} label="Watch" />
        <RailItem comingSoon icon={<UsersRound size={20} />} label="Friends" />
        <RailItem comingSoon icon={<Crown size={20} />} label="Clubs" />
        <RailItem comingSoon icon={<Trophy size={20} />} label="Leaderboard" />
        <RailItem icon={<UserRound size={20} />} label="Profile" to="/profile" />
        <RailItem comingSoon icon={<ShoppingBag size={20} />} label="Store" />
        <RailItem comingSoon icon={<Settings size={20} />} label="Settings" />
      </ul>
      <div className="p-4">
        <LogoutButton className="w-full gap-2 rounded-lg" onError={onLogoutError} />
        <p className="mt-4 text-center text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#9c8f79]">
          {appInfo.appName} beta · {appInfo.appVersion}
        </p>
      </div>
    </nav>
  )
}

function RailItem({
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
    ? 'flex min-h-12 translate-x-1 items-center gap-4 rounded-lg border-l-4 border-[#f9bd22] bg-[#3a3429] px-4 text-sm font-black uppercase tracking-[0.06em] text-[#ffdf9f]'
    : 'flex min-h-12 items-center gap-4 rounded-lg px-4 text-sm font-black uppercase tracking-[0.06em] text-[#d3c5ac] transition hover:bg-[#2f291f] hover:text-[#ece1d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6bd8cb]'
  const content = (
    <>
      {icon}
      <span>{label}</span>
      {comingSoon ? (
        <span className="ml-auto rounded-full border border-[#4f4633] px-2 py-1 text-[0.56rem] text-[#9c8f79]">
          Soon
        </span>
      ) : null}
    </>
  )

  if (to && !comingSoon) {
    return (
      <li>
        <Link aria-current={active ? 'page' : undefined} className={className} to={to}>
          {content}
        </Link>
      </li>
    )
  }

  return (
    <li>
      <div aria-disabled={comingSoon || undefined} className={className}>
        {content}
      </div>
    </li>
  )
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-xl border-t border-[#4f4633] bg-[#3a3429] px-4 pb-4 pt-2 shadow-2xl lg:hidden">
      <MobileNavItem icon={<Home size={20} />} label="Home" to="/" />
      <MobileNavItem active icon={<Table2 size={20} />} label="Play" to="/lobby" />
      <MobileNavItem comingSoon icon={<Eye size={20} />} label="Watch" />
      <MobileNavItem icon={<UserRound size={20} />} label="Profile" to="/profile" />
    </nav>
  )
}

function MobileNavItem({
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
    ? 'flex min-w-16 flex-col items-center justify-center rounded-xl bg-[#fbbf24] p-2 text-[#402d00] shadow-md'
    : 'flex min-w-16 flex-col items-center justify-center rounded-lg p-2 text-[#d3c5ac] transition hover:bg-[#2f291f]'
  const content = (
    <>
      {icon}
      <span className="mt-1 text-[0.68rem] font-black">{label}</span>
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
    <div aria-disabled={comingSoon || undefined} className={`${className} opacity-70`}>
      {content}
    </div>
  )
}

function FutureModeCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-[linear-gradient(45deg,rgba(249,189,34,0.55),rgba(120,53,15,0.5))] p-px opacity-85">
      <div className="h-full rounded-[0.72rem] border border-cream-100/8 bg-[repeating-linear-gradient(90deg,rgba(255,244,214,0.03)_0_1px,transparent_1px_18px),linear-gradient(145deg,#2f291f,#241f15)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6bd8cb]">
              Coming soon
            </p>
            <h3 className="mt-2 text-lg font-black text-[#ece1d1]">{label}</h3>
          </div>
          <span className="grid size-10 place-items-center rounded-xl border border-[#4f4633] bg-[#17130a] text-[#fbbf24]">
            <MessageCircle aria-hidden="true" size={17} />
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#d3c5ac]">
          Preview only. Not playable yet.
        </p>
      </div>
    </div>
  )
}
