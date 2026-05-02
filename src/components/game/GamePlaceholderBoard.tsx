import { Card } from '../common/Card'

export function GamePlaceholderBoard() {
  return (
    <Card className="bg-felt-700/35 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Live round
      </p>
      <h2 className="mt-3 text-2xl font-black text-cream-50">
        Text-card dominoes
      </h2>
      <p className="mt-3 text-sm leading-6 text-cream-100/72">
        Play and pass actions are secured by Supabase RPCs. Polished tile art
        arrives in a later sprint.
      </p>
    </Card>
  )
}
