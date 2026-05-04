import { type BoardPlacementDto, type BoardStateDto } from '../games/types'
import { type GameMode } from '../lobby/types'
import { type FeaturedLiveGamePreview } from './types'

const LIVE_PREVIEW_POLL_INTERVAL_MS = 12000

export const homePreviewKeys = {
  featuredLiveGame: () => ['home', 'featured-live-game-preview'] as const,
}

export function getLivePreviewPollInterval(isPageVisible: boolean): number | false {
  return isPageVisible ? LIVE_PREVIEW_POLL_INTERVAL_MS : false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function getNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getBoolean(value: unknown): boolean {
  return value === true
}

function getGameMode(value: unknown): GameMode {
  return value === 'cutthroat_4' ? value : 'cutthroat_4'
}

function getOpenEnds(value: unknown): BoardStateDto['openEnds'] {
  if (!isRecord(value)) {
    return { left: null, right: null }
  }

  return {
    left:
      typeof value.left === 'number' && Number.isFinite(value.left)
        ? value.left
        : null,
    right:
      typeof value.right === 'number' && Number.isFinite(value.right)
        ? value.right
        : null,
  }
}

function mapBoardState(value: unknown): FeaturedLiveGamePreview['boardState'] {
  if (!isRecord(value)) {
    return {
      placements: [],
      openEnds: { left: null, right: null },
    }
  }

  const placements = Array.isArray(value.placements)
    ? (value.placements as BoardPlacementDto[])
    : []
  const boardState = {
    placements,
    openEnds: getOpenEnds(value.openEnds),
  }

  if (isRecord(value.visual)) {
    return {
      ...boardState,
      visual: value.visual as BoardStateDto['visual'],
    }
  }

  return boardState
}

export function mapFeaturedLiveGamePreviewPayload(
  payload: unknown,
): FeaturedLiveGamePreview | null {
  if (!isRecord(payload)) {
    return null
  }

  const gameId = getString(payload.gameId)
  const tableId = getString(payload.tableId)
  const tableName = getString(payload.tableName)

  if (!gameId || !tableId || !tableName || payload.status !== 'active') {
    return null
  }

  const boardState = mapBoardState(payload.boardState)
  const players = Array.isArray(payload.players)
    ? payload.players
        .filter(isRecord)
        .map((player) => {
          const seatNumber = getNumber(player.seatNumber, 0)

          return {
            displayName:
              getString(player.displayName) ??
              getString(player.username) ??
              `Seat ${seatNumber || '?'}`,
            seatNumber,
            score: getNumber(player.score, 0),
            handCount: Math.max(0, getNumber(player.handCount, 0)),
            isCurrentTurn: getBoolean(player.isCurrentTurn),
          }
        })
        .filter((player) => player.seatNumber > 0)
    : []

  return {
    gameId,
    tableId,
    tableName,
    gameMode: getGameMode(payload.gameMode),
    status: 'active',
    currentRoundNumber: Math.max(1, getNumber(payload.currentRoundNumber, 1)),
    pointsToWin: Math.max(1, getNumber(payload.pointsToWin, 6)),
    moveCount: Math.max(0, getNumber(payload.moveCount, 0)),
    dominoesInPlay: Math.max(
      0,
      getNumber(payload.dominoesInPlay, boardState.placements.length),
    ),
    boardState,
    players,
  }
}
