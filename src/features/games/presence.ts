const ACTIVE_THRESHOLD_MS = 45_000
const JUST_NOW_THRESHOLD_MS = 60_000

export type PlayerPresenceStatus = 'active' | 'away' | 'unknown'

export type PlayerPresence = {
  status: PlayerPresenceStatus
  label: string
  description: string
}

function parseSeenAt(lastSeenAt?: string | null) {
  if (!lastSeenAt) {
    return null
  }

  const seenAt = new Date(lastSeenAt)

  return Number.isNaN(seenAt.getTime()) ? null : seenAt
}

export function isRecentlyActive(
  lastSeenAt?: string | null,
  now: Date = new Date(),
) {
  const seenAt = parseSeenAt(lastSeenAt)

  if (!seenAt) {
    return false
  }

  return now.getTime() - seenAt.getTime() <= ACTIVE_THRESHOLD_MS
}

export function getLastSeenText(
  lastSeenAt?: string | null,
  now: Date = new Date(),
) {
  const seenAt = parseSeenAt(lastSeenAt)

  if (!seenAt) {
    return 'No recent activity yet'
  }

  const elapsedMs = Math.max(0, now.getTime() - seenAt.getTime())

  if (elapsedMs < JUST_NOW_THRESHOLD_MS) {
    return 'Seen just now'
  }

  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000))

  if (elapsedMinutes < 60) {
    return `Last seen ${elapsedMinutes}m ago`
  }

  const elapsedHours = Math.max(1, Math.round(elapsedMinutes / 60))

  return `Last seen ${elapsedHours}h ago`
}

export function getPlayerPresence({
  isConnected,
  lastSeenAt,
  now = new Date(),
}: {
  isConnected: boolean
  lastSeenAt?: string | null
  now?: Date
}): PlayerPresence {
  if (!parseSeenAt(lastSeenAt)) {
    return {
      status: 'unknown',
      label: 'Unknown',
      description: 'No recent activity yet',
    }
  }

  const description = getLastSeenText(lastSeenAt, now)

  if (isConnected && isRecentlyActive(lastSeenAt, now)) {
    return {
      status: 'active',
      label: 'Active',
      description,
    }
  }

  return {
    status: 'away',
    label: 'Away',
    description,
  }
}
