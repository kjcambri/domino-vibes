import { useEffect } from 'react'
import { heartbeatGamePresence, markStalePlayers } from './gameService'

const GAME_HEARTBEAT_INTERVAL_MS = 15_000
const STALE_MARK_INTERVAL_MS = 25_000

function logPresenceError(action: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[Domino Vibes presence] ${action} failed`, error)
  }
}

export function useGamePresence(gameId?: string, enabled = true) {
  useEffect(() => {
    if (!gameId || !enabled) {
      return
    }

    const sendHeartbeat = () => {
      void heartbeatGamePresence(gameId).catch((error) => {
        logPresenceError('heartbeat_game_presence', error)
      })
    }

    const markStale = () => {
      void markStalePlayers(gameId).catch((error) => {
        logPresenceError('mark_stale_players', error)
      })
    }

    sendHeartbeat()
    markStale()

    const heartbeatIntervalId = window.setInterval(
      sendHeartbeat,
      GAME_HEARTBEAT_INTERVAL_MS,
    )
    const staleIntervalId = window.setInterval(
      markStale,
      STALE_MARK_INTERVAL_MS,
    )

    return () => {
      window.clearInterval(heartbeatIntervalId)
      window.clearInterval(staleIntervalId)
    }
  }, [enabled, gameId])
}
