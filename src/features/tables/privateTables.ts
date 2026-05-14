export const PRIVATE_INVITE_CODE_MIN_LENGTH = 6
export const PRIVATE_INVITE_CODE_MAX_LENGTH = 10

export function normalizePrivateInviteCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

export function isValidPrivateInviteCode(value: string) {
  const normalized = normalizePrivateInviteCode(value)

  return (
    normalized === value.toUpperCase() &&
    normalized.length >= PRIVATE_INVITE_CODE_MIN_LENGTH &&
    normalized.length <= PRIVATE_INVITE_CODE_MAX_LENGTH
  )
}

export function formatPrivateInviteCode(value: string) {
  return normalizePrivateInviteCode(value).replace(/(.{2})/g, '$1 ').trim()
}

export function getPrivateTableLabel(isPrivate: boolean) {
  return isPrivate ? 'Private Table' : 'Club Table'
}
