import { useEffect } from 'react'
import { heartbeatTablePresence } from './tableService'

const TABLE_HEARTBEAT_INTERVAL_MS = 15_000

export function useTablePresence(tableId?: string, enabled = true) {
  useEffect(() => {
    if (!tableId || !enabled) {
      return
    }

    const sendHeartbeat = () => {
      void heartbeatTablePresence(tableId).catch((error) => {
        if (import.meta.env.DEV) {
          console.debug(
            '[Domino Vibes presence] heartbeat_table_presence failed',
            error,
          )
        }
      })
    }

    sendHeartbeat()

    const intervalId = window.setInterval(
      sendHeartbeat,
      TABLE_HEARTBEAT_INTERVAL_MS,
    )

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, tableId])
}
