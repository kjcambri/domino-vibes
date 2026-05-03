import { describe, expect, it } from 'vitest'
import {
  getLastSeenText,
  getPlayerPresence,
  isRecentlyActive,
} from '../presence'

const NOW = new Date('2026-05-03T12:00:00.000Z')

describe('player presence helpers', () => {
  it('treats recently connected players as active', () => {
    const presence = getPlayerPresence({
      isConnected: true,
      lastSeenAt: '2026-05-03T11:59:45.000Z',
      now: NOW,
    })

    expect(presence.status).toBe('active')
    expect(presence.label).toBe('Active')
    expect(presence.description).toBe('Seen just now')
  })

  it('treats stale players as away even if their stored flag is still connected', () => {
    const presence = getPlayerPresence({
      isConnected: true,
      lastSeenAt: '2026-05-03T11:58:30.000Z',
      now: NOW,
    })

    expect(presence.status).toBe('away')
    expect(presence.label).toBe('Away')
    expect(presence.description).toBe('Last seen 2m ago')
  })

  it('treats explicitly disconnected players as away', () => {
    expect(
      getPlayerPresence({
        isConnected: false,
        lastSeenAt: '2026-05-03T11:59:50.000Z',
        now: NOW,
      }).status,
    ).toBe('away')
  })

  it('handles missing or invalid timestamps without crashing', () => {
    expect(
      getPlayerPresence({
        isConnected: true,
        lastSeenAt: null,
        now: NOW,
      }),
    ).toEqual({
      status: 'unknown',
      label: 'Unknown',
      description: 'No recent activity yet',
    })
  })

  it('uses a forty-five second recent activity threshold', () => {
    expect(
      isRecentlyActive('2026-05-03T11:59:15.000Z', NOW),
    ).toBe(true)
    expect(
      isRecentlyActive('2026-05-03T11:59:14.000Z', NOW),
    ).toBe(false)
  })

  it('formats last seen text in compact friendly units', () => {
    expect(getLastSeenText('2026-05-03T11:59:50.000Z', NOW)).toBe(
      'Seen just now',
    )
    expect(getLastSeenText('2026-05-03T11:58:00.000Z', NOW)).toBe(
      'Last seen 2m ago',
    )
    expect(getLastSeenText('2026-05-03T09:00:00.000Z', NOW)).toBe(
      'Last seen 3h ago',
    )
  })
})
