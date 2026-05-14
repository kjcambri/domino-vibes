import { CircleCheck, UserRound } from 'lucide-react'
import { DominoImageTile } from './DominoImageTile'
import { StatusChip } from '../ui/StatusChip'
import { getPlayerPresence } from '../../features/games/presence'
import {
  getHiddenRackSlots,
  type TableSeatPosition,
} from '../../features/games/tableSeating'
import { type GameRoomPlayer } from '../../features/games/types'
import { cn } from '../../lib/cn'

type SeatedOpponentRackProps = {
  player: GameRoomPlayer | null
  position: Exclude<TableSeatPosition, 'bottom'>
  currentTurnPlayerId?: string | null
}

export function SeatedOpponentRack({
  player,
  position,
  currentTurnPlayerId,
}: SeatedOpponentRackProps) {
  const isCurrentTurn = Boolean(player?.playerId) && player?.playerId === currentTurnPlayerId
  const presence = player
    ? getPlayerPresence({
        isConnected: player.isConnected,
        lastSeenAt: player.lastSeenAt,
      })
    : null

  return (
    <section
      aria-label={
        player
          ? `${getPlayerName(player)} hidden hand, ${player.handCount} dominoes`
          : `Open ${position} seat`
      }
      className={cn(
        'rounded-3xl border bg-green-950/58 p-3 shadow-[0_16px_38px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,244,214,0.08)] backdrop-blur',
        isCurrentTurn
          ? 'border-gold-300/48 shadow-[0_0_32px_rgba(242,193,78,0.2),0_18px_44px_rgba(0,0,0,0.28)]'
          : 'border-cream-100/12',
        position === 'left' && 'xl:rounded-r-[2rem]',
        position === 'right' && 'xl:rounded-l-[2rem]',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3',
          position === 'right' && 'xl:flex-row-reverse xl:text-right',
        )}
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-2xl border text-cream-100 shadow-wood',
            isCurrentTurn
              ? 'border-gold-300/40 bg-gold-300/16 text-gold-100'
              : 'border-cream-100/12 bg-green-950/54',
          )}
        >
          {isCurrentTurn ? (
            <CircleCheck aria-hidden="true" size={18} />
          ) : (
            <UserRound aria-hidden="true" size={18} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-cream-50">
            {player ? getPlayerName(player) : 'Open seat'}
          </p>
          <p className="mt-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-cream-100/55">
            {player ? `Seat ${player.seatNumber}` : position}
          </p>
        </div>
      </div>

      {player ? (
        <>
          <HiddenRack
            handCount={player.handCount}
            isSideRack={position === 'left' || position === 'right'}
            playerName={getPlayerName(player)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {isCurrentTurn ? <StatusChip tone="gold">Turn</StatusChip> : null}
            <StatusChip tone="cream">{player.handCount} tiles</StatusChip>
            <StatusChip tone="wood">{player.score} pts</StatusChip>
            <StatusChip
              className={
                presence?.status === 'active'
                  ? 'border-teal-300/30 bg-teal-300/12 text-teal-100'
                  : ''
              }
              tone={presence?.status === 'active' ? 'felt' : 'cream'}
            >
              {presence?.label ?? 'Unknown'}
            </StatusChip>
            {player.hasPassed ? <StatusChip tone="red">Passed</StatusChip> : null}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-cream-100/18 px-3 py-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-cream-100/45">
          Waiting
        </div>
      )}
    </section>
  )
}

function HiddenRack({
  handCount,
  isSideRack,
  playerName,
}: {
  handCount: number
  isSideRack: boolean
  playerName: string
}) {
  const slots = getHiddenRackSlots(handCount)

  return (
    <div
      aria-label={`${playerName} has ${handCount} hidden dominoes`}
      className={cn(
        'mt-3 rounded-2xl border border-cream-100/10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,244,214,0.1),transparent_9rem),linear-gradient(180deg,rgba(20,107,74,0.5),rgba(6,31,24,0.5))] p-2 shadow-[inset_0_1px_0_rgba(255,244,214,0.12),inset_0_-10px_24px_rgba(0,0,0,0.18)]',
        isSideRack ? 'xl:p-2' : '',
      )}
    >
      <div
        className={cn(
          'flex justify-center gap-1.5 overflow-hidden',
          isSideRack ? 'flex-wrap xl:grid xl:grid-cols-2' : 'flex-wrap',
        )}
      >
        {slots.map((slot) => (
          <DominoImageTile
            ariaLabel={`${playerName} hidden domino`}
            hidden
            key={slot.slotId}
            size="tiny"
          />
        ))}
      </div>
    </div>
  )
}

function getPlayerName(player: GameRoomPlayer) {
  return player.displayName || player.username || `Seat ${player.seatNumber}`
}
