import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Copy, Crown, LockKeyhole, UsersRound } from 'lucide-react'
import { SoundToggleButton } from '../audio/SoundToggleButton'
import { Button } from '../common/Button'
import { buttonClasses } from '../common/buttonStyles'
import { GameCard } from '../ui/GameCard'
import { type TableRoomInfo } from '../../features/tables/types'
import { formatPrivateInviteCode } from '../../features/tables/privateTables'
import { GameModeLabel } from '../lobby/GameModeLabel'
import { TableStatusBadge } from '../lobby/TableStatusBadge'

export function TableRoomHeader({ table }: { table: TableRoomInfo }) {
  const [copied, setCopied] = useState(false)
  const formattedInviteCode = table.inviteCode
    ? formatPrivateInviteCode(table.inviteCode)
    : null

  async function handleCopyInvite() {
    if (!table.inviteCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(table.inviteCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <header className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
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
        <SoundToggleButton />
      </div>

      <GameCard className="relative overflow-hidden" variant="wood">
        <div className="absolute -right-12 -top-12 size-36 rounded-full bg-gold-300/12 blur-2xl" />
        <div className="absolute left-8 top-0 h-px w-32 bg-gradient-to-r from-transparent via-teal-300/70 to-transparent" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <GameModeLabel gameMode={table.gameMode} />
              {table.isPrivate ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/12 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-teal-100">
                  <LockKeyhole aria-hidden="true" size={13} />
                  Private Table
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/25 bg-gold-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-gold-100">
                <Crown aria-hidden="true" size={13} />
                Ready room
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-black leading-tight text-cream-50">
              {table.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-cream-100/70">
              Claim a seat, ready up, and keep the table talk warm while the
              next Cutthroat 4 round forms.
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-teal-300">
              {table.maxPlayers} seats · Points to Win: 6
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-teal-300/25 bg-teal-300/12 text-teal-100 shadow-teal">
            <UsersRound aria-hidden="true" size={21} />
          </span>
        </div>
        <div className="relative mt-4">
          <TableStatusBadge status={table.status} />
        </div>
        {formattedInviteCode ? (
          <div className="relative mt-4 rounded-2xl border border-teal-300/20 bg-green-950/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
                  Invite code
                </p>
                <p className="mt-1 font-mono text-2xl font-black tracking-[0.16em] text-cream-50">
                  {formattedInviteCode}
                </p>
              </div>
              <Button
                className="gap-2"
                onClick={handleCopyInvite}
                type="button"
                variant="secondary"
              >
                <Copy aria-hidden="true" size={17} />
                {copied ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-cream-100/68">
              Share this code with invited players. They can join from the
              Private Tables panel in the lobby.
            </p>
          </div>
        ) : null}
      </GameCard>
    </header>
  )
}
