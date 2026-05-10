import { describe, expect, it } from 'vitest'
import { betaFeedbackEmail, createBetaFeedbackMailto } from '../feedback'

describe('beta feedback helpers', () => {
  it('creates a mailto link with the beta feedback address', () => {
    const href = createBetaFeedbackMailto({
      pageUrl: 'https://dominovibes.com/lobby',
      source: 'Lobby beta card',
    })

    expect(href).toContain(`mailto:${betaFeedbackEmail}`)
    expect(decodeURIComponent(href)).toContain('Domino Vibes beta feedback')
    expect(decodeURIComponent(href)).toContain('https://dominovibes.com/lobby')
    expect(decodeURIComponent(href)).toContain('Lobby beta card')
  })

  it('reminds testers not to include sensitive data', () => {
    const href = decodeURIComponent(createBetaFeedbackMailto())

    expect(href).toContain('Please do not include passwords')
    expect(href).toContain('hidden hand tile data')
  })
})
