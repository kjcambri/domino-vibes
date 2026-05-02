import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoutButton } from '../components/auth/LogoutButton'
import { Card } from '../components/common/Card'
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

    navigate(`/tables/${currentTable.tableId}`)
  }

  function handleRejoinTable(tableId: string) {
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
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 py-4">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            Lobby
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-cream-50">
            Welcome, {playerName}.
          </h1>
          <p className="mt-4 text-base leading-7 text-cream-100/78">
            Choose a system table and take a seat. Games, ready checks, and
            table chat arrive in later sprints.
          </p>
          {logoutError || tableError ? (
            <div
              className="mt-5 rounded-md border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
              role="alert"
            >
              {logoutError || tableError}
            </div>
          ) : null}
          <LogoutButton
            className="mt-6 w-full gap-2"
            onError={setLogoutError}
          />
        </Card>

        {isCurrentTableLoading ? (
          <Card>
            <p className="text-sm font-bold text-cream-50">
              Checking your table seat...
            </p>
          </Card>
        ) : null}

        {currentTableError ? (
          <Card className="border-red-300/30 bg-red-800/20">
            <p className="text-sm font-bold text-red-100">
              Could not check your current table.
            </p>
            <p className="mt-2 text-sm leading-6 text-red-100/80">
              {getFriendlyAuthError(currentTableError)}
            </p>
          </Card>
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
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
                Available tables
              </p>
              <h2 className="mt-1 text-2xl font-black text-cream-50">
                System tables
              </h2>
            </div>
          </div>

          {lobbyTables.isLoading ? (
            <Card>
              <p className="text-sm font-bold text-cream-50">Loading tables...</p>
              <p className="mt-2 text-sm leading-6 text-cream-100/70">
                Pulling the latest seats from Domino Vibes.
              </p>
            </Card>
          ) : null}

          {lobbyTables.isError ? (
            <Card className="border-red-300/30 bg-red-800/20">
              <p className="text-sm font-bold text-red-100">
                Could not load tables.
              </p>
              <p className="mt-2 text-sm leading-6 text-red-100/80">
                {getFriendlyAuthError(lobbyTables.error)}
              </p>
            </Card>
          ) : null}

          {lobbyTables.data?.length === 0 ? (
            <Card>
              <p className="text-sm font-bold text-cream-50">
                No tables are open.
              </p>
              <p className="mt-2 text-sm leading-6 text-cream-100/70">
                System-created tables will appear here when available.
              </p>
            </Card>
          ) : null}

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
        </section>
      </div>
    </MobileShell>
  )
}
