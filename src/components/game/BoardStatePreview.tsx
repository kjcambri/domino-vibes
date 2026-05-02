import { Card } from '../common/Card'
import { type BoardStateDto } from '../../features/games/types'

export function BoardStatePreview({ boardState }: { boardState: BoardStateDto }) {
  const isEmpty = boardState.placements.length === 0

  return (
    <Card className="bg-felt-700/35 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Board
      </p>
      <h2 className="mt-3 text-2xl font-black text-cream-50">
        {isEmpty ? 'Board is empty.' : 'Board state loaded.'}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-md border border-cream-100/10 bg-green-950/45 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-200">
            Left open
          </p>
          <p className="mt-1 text-lg font-black text-cream-50">
            {boardState.openEnds.left ?? '-'}
          </p>
        </div>
        <div className="rounded-md border border-cream-100/10 bg-green-950/45 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-200">
            Right open
          </p>
          <p className="mt-1 text-lg font-black text-cream-50">
            {boardState.openEnds.right ?? '-'}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-cream-100/72">
        {isEmpty
          ? 'First move starts in Sprint 7.'
          : 'Tile play is still reserved for Sprint 7.'}
      </p>
    </Card>
  )
}
