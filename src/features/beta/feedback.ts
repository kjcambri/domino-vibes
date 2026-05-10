export const betaFeedbackEmail = 'feedback@dominovibes.com'

type BetaFeedbackInput = {
  pageUrl?: string
  source?: string
}

const reportTemplate = ({
  pageUrl = 'Paste the page URL here',
  source = 'Domino Vibes beta',
}: BetaFeedbackInput = {}) => `Beta feedback source: ${source}
Page URL: ${pageUrl}
Device/browser:
Account used:

What happened:

What I expected:

Steps to reproduce:
1.
2.
3.

Screenshot/video:
Console error, if any:
Severity: blocker / major / minor / polish

Please do not include passwords, tokens, or hidden hand tile data.`

export function createBetaFeedbackMailto(input: BetaFeedbackInput = {}) {
  const subject = encodeURIComponent('Domino Vibes beta feedback')
  const body = encodeURIComponent(reportTemplate(input))

  return `mailto:${betaFeedbackEmail}?subject=${subject}&body=${body}`
}
