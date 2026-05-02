import { createEmptyBoard, placeTileOnBoard } from './board'
import { dealTiles } from './deal'
import { calculateHandPips, buildScores } from './scoring'
import { shuffleTiles, type RandomFn } from './shuffle'
import { createDoubleSixSet } from './tiles'
import { advanceTurn, clonePlayers } from './turns'
import {
  type BoardSide,
  type MoveResult,
  type PlayerEngineState,
  type PlayerId,
  type RoundScores,
  type RoundState,
  type SeatNumber,
} from './types'
import { canPlayerPlay, isLegalMove } from './validation'

export function createInitialRound(
  playerIds: PlayerId[],
  randomFn?: RandomFn,
): RoundState {
  const shuffledTiles = shuffleTiles(createDoubleSixSet(), randomFn)
  const deal = dealTiles(shuffledTiles, playerIds)
  const players = playerIds.map((playerId, index) => ({
    playerId,
    seatNumber: (index + 1) as SeatNumber,
    turnOrder: index,
    hand: deal.hands[playerId] ?? [],
    hasPassed: false,
  }))
  const startingPlayer = findStartingPlayer(players)

  return {
    gameMode: 'cutthroat_4',
    players,
    board: createEmptyBoard(),
    currentTurnPlayerId: startingPlayer.playerId,
    turnNumber: 1,
    consecutivePasses: 0,
    status: 'active',
    roundWinnerPlayerId: null,
    endedReason: null,
  }
}

export function findStartingPlayer(
  players: PlayerEngineState[],
): PlayerEngineState {
  return [...players].sort(compareStartingPlayer)[0]!
}

export function playTile(
  state: RoundState,
  playerId: PlayerId,
  tileId: string,
  side: BoardSide,
): MoveResult {
  const activeError = getActiveTurnError(state, playerId)
  if (activeError) {
    return failure(state, activeError)
  }

  const player = state.players.find((candidate) => candidate.playerId === playerId)
  const tile = player?.hand.find((candidate) => candidate.id === tileId)

  if (!player || !tile) {
    return failure(state, 'Player does not own tile')
  }

  if (!isLegalMove(tile, state.board, side)) {
    return failure(state, 'Move is not legal')
  }

  let nextBoard: RoundState['board']
  try {
    nextBoard = placeTileOnBoard(
      state.board,
      tile,
      side,
      playerId,
      state.turnNumber,
    )
  } catch (error) {
    return failure(state, error instanceof Error ? error.message : 'Move failed')
  }

  const nextPlayers = clonePlayers(state.players).map((candidate) =>
    candidate.playerId === playerId
      ? {
          ...candidate,
          hand: candidate.hand.filter((handTile) => handTile.id !== tileId),
          hasPassed: false,
        }
      : candidate,
  )
  const nextPlayer = nextPlayers.find((candidate) => candidate.playerId === playerId)

  if (!nextPlayer) {
    return failure(state, 'Player not found')
  }

  if (nextPlayer.hand.length === 0) {
    return success({
      ...state,
      players: nextPlayers,
      board: nextBoard,
      status: 'round_finished',
      roundWinnerPlayerId: playerId,
      endedReason: 'player_went_out',
      consecutivePasses: 0,
    })
  }

  const nextState = {
    ...state,
    players: nextPlayers,
    board: nextBoard,
    currentTurnPlayerId: advanceTurn(state),
    turnNumber: state.turnNumber + 1,
    consecutivePasses: 0,
  }

  return success(nextState)
}

export function passTurn(state: RoundState, playerId: PlayerId): MoveResult {
  const activeError = getActiveTurnError(state, playerId)
  if (activeError) {
    return failure(state, activeError)
  }

  const player = state.players.find((candidate) => candidate.playerId === playerId)
  if (!player) {
    return failure(state, 'Player not found')
  }

  if (canPlayerPlay(player.hand, state.board)) {
    return failure(state, 'Player has a legal move')
  }

  const nextPlayers = clonePlayers(state.players).map((candidate) =>
    candidate.playerId === playerId
      ? {
          ...candidate,
          hasPassed: true,
        }
      : candidate,
  )
  const consecutivePasses = state.consecutivePasses + 1

  if (consecutivePasses >= nextPlayers.length) {
    const winner = determineBlockedWinner(nextPlayers)
    return success({
      ...state,
      players: nextPlayers,
      status: 'round_finished',
      roundWinnerPlayerId: winner.playerId,
      endedReason: 'blocked',
      consecutivePasses,
    })
  }

  return success({
    ...state,
    players: nextPlayers,
    currentTurnPlayerId: advanceTurn(state),
    turnNumber: state.turnNumber + 1,
    consecutivePasses,
  })
}

export { advanceTurn } from './turns'

export { calculateHandPips } from './scoring'

export function calculateRoundScores(state: RoundState): RoundScores {
  if (state.status !== 'round_finished' || !state.roundWinnerPlayerId) {
    throw new Error('Round is not finished')
  }

  return buildScores(state.players, state.roundWinnerPlayerId)
}

export function determineBlockedWinner(
  players: PlayerEngineState[],
): PlayerEngineState {
  return [...players].sort((first, second) => {
    const pipDelta = calculateHandPips(first.hand) - calculateHandPips(second.hand)
    if (pipDelta !== 0) {
      return pipDelta
    }

    const tileCountDelta = first.hand.length - second.hand.length
    if (tileCountDelta !== 0) {
      return tileCountDelta
    }

    // MVP tie-breaker: earliest turn order wins after pip total and tile count.
    return first.turnOrder - second.turnOrder
  })[0]!
}

function compareStartingPlayer(
  first: PlayerEngineState,
  second: PlayerEngineState,
) {
  const firstBestDouble = getBestDouble(first)
  const secondBestDouble = getBestDouble(second)

  if (firstBestDouble !== secondBestDouble) {
    return secondBestDouble - firstBestDouble
  }

  if (firstBestDouble >= 0) {
    return first.turnOrder - second.turnOrder
  }

  const firstBestTotal = Math.max(...first.hand.map((tile) => tile.pipTotal))
  const secondBestTotal = Math.max(...second.hand.map((tile) => tile.pipTotal))

  if (firstBestTotal !== secondBestTotal) {
    return secondBestTotal - firstBestTotal
  }

  return first.turnOrder - second.turnOrder
}

function getBestDouble(player: PlayerEngineState) {
  const doubles = player.hand.filter((tile) => tile.isDouble)

  if (doubles.length === 0) {
    return -1
  }

  return Math.max(...doubles.map((tile) => tile.left))
}

function getActiveTurnError(state: RoundState, playerId: PlayerId): string | null {
  if (state.status !== 'active') {
    return 'Round is not active'
  }

  if (state.currentTurnPlayerId !== playerId) {
    return 'It is not this player’s turn'
  }

  return null
}

function success(state: RoundState): MoveResult {
  return {
    success: true,
    state,
    error: null,
  }
}

function failure(state: RoundState, error: string): MoveResult {
  return {
    success: false,
    state,
    error,
  }
}
