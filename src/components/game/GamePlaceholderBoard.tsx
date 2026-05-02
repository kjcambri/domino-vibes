import { Card } from '../common/Card'

export function GamePlaceholderBoard() {
  return (
    <Card className="bg-felt-700/35 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Placeholder board
      </p>
      <h2 className="mt-3 text-2xl font-black text-cream-50">
        Game setup created.
      </h2>
      <p className="mt-3 text-sm leading-6 text-cream-100/72">
        Domino engine arrives in Sprint 5. No tiles, hands, moves, or scoring
        are available yet.
      </p>
    </Card>
  )
}
