import { type GameMode } from '../../features/lobby/types'

const labels: Record<GameMode, string> = {
  cutthroat_4: 'Cutthroat 4',
}

export function GameModeLabel({ gameMode }: { gameMode: GameMode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.14em] text-gold-200">
      {labels[gameMode]}
    </span>
  )
}
