import { type GameMode } from '../../features/lobby/types'

const labels: Record<GameMode, string> = {
  cutthroat_4: 'Cutthroat 4',
}

export function GameModeLabel({ gameMode }: { gameMode: GameMode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-gold-300/25 bg-gold-300/12 px-3 text-xs font-black uppercase tracking-[0.14em] text-gold-100">
      {labels[gameMode]}
    </span>
  )
}
