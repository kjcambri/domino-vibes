import { StateCard } from '../ui/StateCard'
import { MobileShell } from './MobileShell'

export function RouteLoadingFallback() {
  return (
    <MobileShell>
      <div className="grid flex-1 place-items-center">
        <StateCard
          copy="Preparing your table path."
          title="Loading Domino Vibes..."
          type="loading"
        />
      </div>
    </MobileShell>
  )
}
