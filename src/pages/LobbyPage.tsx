import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoutButton } from '../components/auth/LogoutButton'
import { GameCard } from '../components/ui/GameCard'
import { SectionHeader } from '../components/ui/SectionHeader'
import { StateCard } from '../components/ui/StateCard'
import { CurrentTableBanner } from '../components/lobby/CurrentTableBanner'
import { LobbyTableCard } from '../components/lobby/LobbyTableCard'
import { MobileShell } from '../components/layout/MobileShell'
import { useLobbyRealtime } from '../features/lobby/useLobbyRealtime'
import { useJoinTable, useLobbyTables } from '../features/lobby/useLobbyTables'
import { useProfile } from '../features/profiles/useProfile'
import { useMyCurrentTable } from '../features/tables/useMyCurrentTable'
import { useLeaveTable } from '../features/tables/useTableRoom'
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

  return (
    <MobileShell className="max-w-5xl">
      <div className="flex flex-1 flex-col gap-5 py-4">
        <GameCard className="relative overflow-hidden" variant="wood">
          <div className="absolute -right-16 -top-16 size-44 rounded-full bg-gold-300/12 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
              Domino Vibes Lobby
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-cream-50">
              Welcome, {playerName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-cream-100/78">
              Choose a table, claim a seat, and get the yard ready. Cutthroat
              4 is live with secure hands, rejoin, and round-win scoring.
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

        <section className="grid gap-3">
          <SectionHeader
            copy="Pick a system table and jump into the next domino session."
            eyebrow="Available tables"
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

          <div className="grid gap-3 md:grid-cols-2">
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
        </section>
      </div>
    </MobileShell>
  )
}
