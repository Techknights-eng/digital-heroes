export const DRAW_CONFIG = {
  numberCount: 5,
  numberMin: null,
  numberMax: null,
  scoreNumberTransformation: null,
  prizePoolPercentage: null,
  eligibilityCutoff: null,
  rolloverPolicy: null,
  tierPercentages: { 5: 40, 4: 35, 3: 25 },
}

export function requireDrawConfiguration() {
  const missing = []
  if (!Number.isInteger(DRAW_CONFIG.numberMin) || !Number.isInteger(DRAW_CONFIG.numberMax)) missing.push('draw number range')
  if (typeof DRAW_CONFIG.scoreNumberTransformation !== 'function') missing.push('score-to-draw-number transformation')
  if (typeof DRAW_CONFIG.prizePoolPercentage !== 'number') missing.push('prize-pool contribution percentage')
  if (!DRAW_CONFIG.eligibilityCutoff) missing.push('draw eligibility cutoff')
  if (!DRAW_CONFIG.rolloverPolicy) missing.push('jackpot rollover policy')
  if (missing.length) throw new Error(`Draw configuration is incomplete: ${missing.join(', ')}.`)
}