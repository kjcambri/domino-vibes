import { Card } from '../common/Card'
import { type MyHand } from '../../features/games/types'

export function MyHandPreview({ hand }: { hand: MyHand | null }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Your Hand
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {hand?.tiles.map((tile) => (
          <div
            className="grid min-h-14 place-items-center rounded-md border border-cream-900/15 bg-cream-50 px-2 py-3 text-sm font-black text-green-950 shadow-wood"
            key={tile.id}
          >
            {tile.id}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-cream-100/72">
        Secure hands are now loaded. Tile playing arrives in Sprint 7.
      </p>
    </Card>
  )
}
