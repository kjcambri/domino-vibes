import { useParams } from 'react-router-dom'
import { StatusBadge } from '../components/common/StatusBadge'
import { PageScaffold } from './PageScaffold'

export function GameRoomPage() {
  const { gameId } = useParams()

  return (
    <PageScaffold
      description="The game board, hand controls, score state, turn rules, and multiplayer sync will be introduced in a gameplay sprint."
      eyebrow={`Game route: ${gameId ?? 'unknown'}`}
      title="Gameplay is intentionally not built yet."
    >
      <StatusBadge status="in-game" />
    </PageScaffold>
  )
}
