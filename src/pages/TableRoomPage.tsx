import { useParams } from 'react-router-dom'
import { StatusBadge } from '../components/common/StatusBadge'
import { PageScaffold } from './PageScaffold'

export function TableRoomPage() {
  const { tableId } = useParams()

  return (
    <PageScaffold
      description="Table settings, seated players, chat, and ready states will appear here once lobby behavior is implemented."
      eyebrow={`Table route: ${tableId ?? 'unknown'}`}
      title="A table room will host the pre-game flow."
    >
      <StatusBadge status="ready" />
    </PageScaffold>
  )
}
