import { describe, expect, it } from 'vitest'
import {
  formatPrivateInviteCode,
  getPrivateTableLabel,
  isValidPrivateInviteCode,
  normalizePrivateInviteCode,
} from '../privateTables'

describe('private table helpers', () => {
  it('normalizes invite codes for lookup and sharing', () => {
    expect(normalizePrivateInviteCode(' dv-92 kq ')).toBe('DV92KQ')
    expect(normalizePrivateInviteCode('club_123')).toBe('CLUB123')
  })

  it('validates compact alphanumeric invite codes only', () => {
    expect(isValidPrivateInviteCode('DV92KQ')).toBe(true)
    expect(isValidPrivateInviteCode('dv92kq')).toBe(true)
    expect(isValidPrivateInviteCode('DV9')).toBe(false)
    expect(isValidPrivateInviteCode('THISCODEISTOOLONG')).toBe(false)
    expect(isValidPrivateInviteCode('DV 92')).toBe(false)
  })

  it('formats invite codes in readable pairs without changing lookup value', () => {
    expect(formatPrivateInviteCode('DV92KQ')).toBe('DV 92 KQ')
    expect(formatPrivateInviteCode('ABC12345')).toBe('AB C1 23 45')
  })

  it('labels public and private tables clearly', () => {
    expect(getPrivateTableLabel(true)).toBe('Private Table')
    expect(getPrivateTableLabel(false)).toBe('Club Table')
  })
})
