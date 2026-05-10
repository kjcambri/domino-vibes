export type BetaMissionPriority = 'blocker' | 'core' | 'mobile' | 'polish'

export type BetaMission = {
  id: string
  label: string
  detail: string
  priority: BetaMissionPriority
}

export const betaReadinessMissions: BetaMission[] = [
  {
    id: 'account-flow',
    label: 'Create and confirm an account',
    detail: 'Sign up with one test email, confirm it, log in, and complete the profile flow.',
    priority: 'blocker',
  },
  {
    id: 'table-flow',
    label: 'Join, ready, and start a table',
    detail: 'Seat four testers, toggle ready states, and start a Cutthroat 4 game.',
    priority: 'core',
  },
  {
    id: 'secure-hands',
    label: 'Check hidden hand safety',
    detail: 'Confirm each tester sees only their own hand while opponents show counts only.',
    priority: 'blocker',
  },
  {
    id: 'gameplay-loop',
    label: 'Complete one round',
    detail: 'Play legal tiles, pass when blocked, finish a round, and start the next round.',
    priority: 'core',
  },
  {
    id: 'rejoin-flow',
    label: 'Refresh and rejoin',
    detail: 'Refresh during a live game and verify the board, hand, chat, and turn state recover.',
    priority: 'core',
  },
  {
    id: 'mobile-play',
    label: 'Try one mobile browser',
    detail: 'Check tap targets, hand scrolling, board scrolling, and page overflow on a phone viewport.',
    priority: 'mobile',
  },
]

export function getBetaMissionsByPriority(priority: BetaMissionPriority) {
  return betaReadinessMissions.filter((mission) => mission.priority === priority)
}

export function getRequiredBetaMissionCount() {
  return betaReadinessMissions.filter((mission) => mission.priority !== 'polish')
    .length
}
