export const forbiddenLandingTerms = [
  'high roller',
  'entry',
  'buy-in',
  'prize pool',
  'bet',
  'wager',
]

export const landingLiveTableLabels = {
  featured: 'Featured Match',
  spectatorPreview: 'Spectator Preview',
  liveMatch: 'Live Match',
  noLiveMatch: 'No Live Match',
  viewAll: 'View All Tables',
}

export const landingBenefitCards = [
  {
    title: 'Custom Table Themes',
    copy: 'Preview future felt, tile-back, and table room styles built for personal expression.',
    status: 'Preview',
  },
  {
    title: 'Distraction-Free Focus',
    copy: 'A future ad-free club experience that keeps attention on table talk and strategy.',
    status: 'Coming Soon',
  },
  {
    title: 'Stats and Recaps',
    copy: 'Track wins, streaks, favorite modes, and match memories once profile stats arrive.',
    status: 'Coming Soon',
  },
]

export function getLandingPrimaryCta(isAuthenticated: boolean) {
  return isAuthenticated
    ? {
        label: 'Enter Lobby',
        to: '/lobby',
      }
    : {
        label: 'Join the Club',
        to: '/signup',
      }
}
