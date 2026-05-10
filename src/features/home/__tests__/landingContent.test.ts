import { describe, expect, it } from 'vitest'
import {
  forbiddenLandingTerms,
  getLandingPrimaryCta,
  landingBenefitCards,
  landingLiveTableLabels,
} from '../landingContent'

describe('landingContent', () => {
  it('routes the primary landing CTA by auth state', () => {
    expect(getLandingPrimaryCta(true)).toEqual({
      label: 'Enter Lobby',
      to: '/lobby',
    })
    expect(getLandingPrimaryCta(false)).toEqual({
      label: 'Join the Club',
      to: '/signup',
    })
  })

  it('keeps public homepage copy out of gambling framing', () => {
    const publicCopy = [
      ...Object.values(landingLiveTableLabels),
      ...landingBenefitCards.flatMap((card) => [card.title, card.copy, card.status]),
    ].join(' ')

    for (const forbiddenTerm of forbiddenLandingTerms) {
      expect(publicCopy.toLowerCase()).not.toContain(forbiddenTerm)
    }
  })
})
