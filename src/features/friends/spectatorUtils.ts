import {
  type BoardPlacementDto,
  type BoardStateDto,
  type GameRoomPlayer,
  type GameStatus,
} from '../games/types'
import { type GameMode } from '../lobby/types'
import { type SpectatorGameRoom } from './types'

type UnknownRecord = Record<string, unknown>

export function mapSpectatorGameRoomPayload(
  payload: unknown,
): SpectatorGameRoom | null {
  if (!isRecord(payload) || !isRecord(payload.game) || !Array.isArray(payload.players)) {
    return null
  }

  const game = mapSpectatorGame(payload.game)

  if (!game) {
    return null
  }

  return {
    game,
    players: payload.players.map(mapSpectatorPlayer).filter(isPresent),
  }
}

function mapSpectatorGame(game: UnknownRecord): SpectatorGameRoom['game'] | null {
  const boardState = mapBoardState(game.boardState)

  if (
    !isString(game.id) ||
    !isString(game.tableId) ||
    !isString(game.tableName) ||
    !isString(game.gameMode) ||
    !isString(game.status) ||
    !isNumber(game.currentRoundNumber) ||
    !isNumber(game.moveCount) ||
    !boardState
  ) {
    return null
  }

  return {
    id: game.id,
    tableId: game.tableId,
    tableName: game.tableName,
    gameMode: game.gameMode as GameMode,
    status: game.status as GameStatus,
    currentRoundNumber: game.currentRoundNumber,
    currentTurnPlayerId: isString(game.currentTurnPlayerId)
      ? game.currentTurnPlayerId
      : null,
    boardState,
    moveCount: game.moveCount,
  }
}

function mapSpectatorPlayer(player: unknown): GameRoomPlayer | null {
  if (!isRecord(player) || !isNumber(player.seatNumber)) {
    return null
  }

  return {
    playerId: isString(player.playerId) ? player.playerId : null,
    seatNumber: player.seatNumber,
    turnOrder: isNumber(player.turnOrder) ? player.turnOrder : player.seatNumber,
    score: isNumber(player.score) ? player.score : 0,
    roundScore: isNumber(player.roundScore) ? player.roundScore : 0,
    hasPassed: player.hasPassed === true,
    isConnected: player.isConnected === true,
    lastSeenAt: isString(player.lastSeenAt) ? player.lastSeenAt : '',
    handCount: isNumber(player.handCount) ? Math.max(0, player.handCount) : 0,
    username: isString(player.username) ? player.username : null,
    displayName: isString(player.displayName) ? player.displayName : null,
    avatarUrl: isString(player.avatarUrl) ? player.avatarUrl : null,
  }
}

function mapBoardState(boardState: unknown): BoardStateDto | null {
  if (!isRecord(boardState) || !isRecord(boardState.openEnds)) {
    return null
  }

  return {
    placements: Array.isArray(boardState.placements)
      ? boardState.placements.map(mapBoardPlacement).filter(isPresent)
      : [],
    openEnds: {
      left: isNullableNumber(boardState.openEnds.left)
        ? boardState.openEnds.left
        : null,
      right: isNullableNumber(boardState.openEnds.right)
        ? boardState.openEnds.right
        : null,
    },
    roundWinnerPlayerId: isString(boardState.roundWinnerPlayerId)
      ? boardState.roundWinnerPlayerId
      : null,
    endedReason: isString(boardState.endedReason)
      ? (boardState.endedReason as BoardStateDto['endedReason'])
      : null,
  }
}

function mapBoardPlacement(placement: unknown): BoardPlacementDto | null {
  if (!isRecord(placement) || !isRecord(placement.tile)) {
    return null
  }

  const tile = placement.tile

  if (
    !isString(tile.id) ||
    !isNumber(tile.left) ||
    !isNumber(tile.right) ||
    !isString(placement.playedBy) ||
    !isString(placement.side) ||
    !isNumber(placement.leftValue) ||
    !isNumber(placement.rightValue) ||
    !isNumber(placement.turnNumber)
  ) {
    return null
  }

  return {
    tile: {
      id: tile.id,
      left: tile.left,
      right: tile.right,
      isDouble: tile.isDouble === true,
      pipTotal: isNumber(tile.pipTotal) ? tile.pipTotal : tile.left + tile.right,
    },
    playedBy: placement.playedBy,
    side: placement.side as BoardPlacementDto['side'],
    leftValue: placement.leftValue,
    rightValue: placement.rightValue,
    turnNumber: placement.turnNumber,
    x: isNumber(placement.x) ? placement.x : undefined,
    y: isNumber(placement.y) ? placement.y : undefined,
    rotation: isNumber(placement.rotation) ? placement.rotation : undefined,
    orientation: isString(placement.orientation)
      ? (placement.orientation as BoardPlacementDto['orientation'])
      : undefined,
    direction: isString(placement.direction)
      ? (placement.direction as BoardPlacementDto['direction'])
      : undefined,
    connectedPip: isNullableNumber(placement.connectedPip)
      ? placement.connectedPip
      : null,
    exposedPip: isNullableNumber(placement.exposedPip)
      ? placement.exposedPip
      : null,
    connectedTileSide:
      placement.connectedTileSide === 'left' || placement.connectedTileSide === 'right'
        ? placement.connectedTileSide
        : null,
    isDouble: placement.isDouble === true,
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}
