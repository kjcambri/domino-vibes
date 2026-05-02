import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { PageScaffold } from './PageScaffold'

const previewTables = [
  { name: 'Santo Domingo', status: 'waiting' as const },
  { name: 'La Placita', status: 'full' as const },
  { name: 'Kingston Night', status: 'in-game' as const },
]

export function LobbyPage() {
  return (
    <PageScaffold
      description="Table discovery, invites, filters, and matchmaking will be built after auth and profile foundations are ready."
      eyebrow="Lobby placeholder"
      title="The lobby will gather live tables."
    >
      <div className="grid gap-3">
        {previewTables.map((table) => (
          <Card className="flex items-center justify-between p-4" key={table.name}>
            <span className="font-bold text-cream-50">{table.name}</span>
            <StatusBadge status={table.status} />
          </Card>
        ))}
        <Link className="text-sm font-bold text-gold-200" to="/tables/demo-table">
          Preview table room route
        </Link>
      </div>
    </PageScaffold>
  )
}
