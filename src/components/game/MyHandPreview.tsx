import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { getLegalSides } from '../../features/games/gameplayRules'
import {
  type BoardSide,
  type BoardStateDto,
  type MyHand,
} from '../../features/games/types'

export function MyHandPreview({
  hand,
  boardState,
  isMyTurn,
  isRoundActive,
  isActionPending,
  onPlayTile,
}: {
  hand: MyHand | null
  boardState: BoardStateDto
  isMyTurn: boolean
  isRoundActive: boolean
  isActionPending: boolean
  onPlayTile: (tileId: string, side: BoardSide) => void
}) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
        Your Hand
      </p>
      <div className="mt-4 grid gap-3">
        {hand?.tiles.map((tile) => {
          const legalSides = getLegalSides(tile, boardState)
          const canPlayTile =
            isRoundActive && isMyTurn && legalSides.length > 0 && !isActionPending

          return (
          <div
            className="rounded-md border border-cream-900/15 bg-cream-50 p-3 text-green-950 shadow-wood"
            key={tile.id}
          >
            <div className="flex min-h-10 items-center justify-center text-lg font-black">
              {tile.id}
            </div>
            {isRoundActive && isMyTurn ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(['start', 'left', 'right'] as BoardSide[]).map((side) => (
                  <Button
                    className="min-h-10 px-2 text-[0.68rem]"
                    disabled={!canPlayTile || !legalSides.includes(side)}
                    key={side}
                    onClick={() => onPlayTile(tile.id, side)}
                    variant={legalSides.includes(side) ? 'primary' : 'ghost'}
                  >
                    {side}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          )
        })}
      </div>
      <p className="mt-4 text-sm leading-6 text-cream-100/72">
        {isMyTurn
          ? 'Choose a legal side to play. The server validates every move.'
          : 'Secure hands stay private while you wait for your turn.'}
      </p>
    </Card>
  )
}
