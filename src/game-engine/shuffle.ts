import { type DominoTile } from './types'

export type RandomFn = () => number

export function shuffleTiles(
  tiles: DominoTile[],
  randomFn: RandomFn = Math.random,
): DominoTile[] {
  const shuffled = [...tiles]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomFn() * (index + 1))
    const current = shuffled[index]
    const random = shuffled[randomIndex]

    if (!current || !random) {
      continue
    }

    shuffled[index] = random
    shuffled[randomIndex] = current
  }

  return shuffled
}
