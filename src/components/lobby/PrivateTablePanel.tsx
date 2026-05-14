import { useState, type FormEvent } from 'react'
import { KeyRound, LockKeyhole, Plus } from 'lucide-react'
import { Button } from '../common/Button'
import { GameCard } from '../ui/GameCard'
import {
  isValidPrivateInviteCode,
  normalizePrivateInviteCode,
} from '../../features/tables/privateTables'

type PrivateTablePanelProps = {
  isCreating: boolean
  isJoining: boolean
  onCreate: (tableName?: string) => void
  onJoin: (inviteCode: string) => void
}

export function PrivateTablePanel({
  isCreating,
  isJoining,
  onCreate,
  onJoin,
}: PrivateTablePanelProps) {
  const [tableName, setTableName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const normalizedInviteCode = normalizePrivateInviteCode(inviteCode)
  const canJoin = isValidPrivateInviteCode(normalizedInviteCode)

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCreate(tableName)
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canJoin) {
      return
    }

    onJoin(normalizedInviteCode)
  }

  return (
    <GameCard className="grid gap-4 p-4" variant="wood">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-gold-300/25 bg-gold-300/12 text-gold-100 shadow-gold">
          <LockKeyhole aria-hidden="true" size={19} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gold-200">
            Private Tables
          </p>
          <h3 className="mt-1 text-xl font-black text-cream-50">
            Host your own table
          </h3>
          <p className="mt-2 text-sm leading-6 text-cream-100/68">
            Create a Cutthroat 4 table and share the invite code with your
            people. Private tables stay out of the public lobby list.
          </p>
        </div>
      </div>

      <form className="grid gap-3" onSubmit={handleCreate}>
        <label className="grid gap-2 text-sm font-black text-cream-100/82">
          Table name
          <input
            className="min-h-12 rounded-2xl border border-cream-100/12 bg-green-950/45 px-4 text-sm font-bold text-cream-50 outline-none transition placeholder:text-cream-100/34 focus:border-gold-300/65 focus:ring-2 focus:ring-gold-300/25"
            maxLength={48}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="Kevon's table"
            value={tableName}
          />
        </label>
        <Button className="w-full gap-2" disabled={isCreating} type="submit">
          <Plus aria-hidden="true" size={18} />
          {isCreating ? 'Creating...' : 'Create Private Table'}
        </Button>
      </form>

      <div className="h-px bg-cream-100/10" />

      <form className="grid gap-3" onSubmit={handleJoin}>
        <label className="grid gap-2 text-sm font-black text-cream-100/82">
          Invite code
          <input
            autoCapitalize="characters"
            className="min-h-12 rounded-2xl border border-cream-100/12 bg-green-950/45 px-4 text-sm font-black uppercase tracking-[0.12em] text-cream-50 outline-none transition placeholder:tracking-normal placeholder:text-cream-100/34 focus:border-teal-300/65 focus:ring-2 focus:ring-teal-300/25"
            maxLength={14}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="DV 92 KQ"
            value={inviteCode}
          />
        </label>
        <Button
          className="w-full gap-2"
          disabled={!canJoin || isJoining}
          type="submit"
          variant="secondary"
        >
          <KeyRound aria-hidden="true" size={18} />
          {isJoining ? 'Joining...' : 'Join by Code'}
        </Button>
      </form>
    </GameCard>
  )
}
