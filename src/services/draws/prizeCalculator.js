import { DRAW_CONFIG } from './drawConfig.js'

export function calculatePrizePool(activeSubscriberCount, subscriptionAmount, configuredPrizePoolPercentage = DRAW_CONFIG.prizePoolPercentage) {
  if (typeof configuredPrizePoolPercentage !== 'number') throw new Error('Prize-pool contribution percentage is not configured.')
  if (!Number.isInteger(activeSubscriberCount) || activeSubscriberCount < 0) throw new Error('Active subscriber count is invalid.')
  return Math.round(activeSubscriberCount * Math.round(Number(subscriptionAmount) * 100) * configuredPrizePoolPercentage / 100)
}

export function calculatePrizes(prizePoolMinorUnits, winnerCounts, tierPercentages = DRAW_CONFIG.tierPercentages) {
  const totalPercentage = Object.values(tierPercentages).reduce((sum, value) => sum + value, 0)
  if (totalPercentage !== 100) throw new Error('Prize tier percentages must total 100%.')
  let remainder = prizePoolMinorUnits
  const prizes = [5, 4, 3].map((tier) => {
    const pool = Math.floor(prizePoolMinorUnits * tierPercentages[tier] / 100)
    const winnerCount = winnerCounts[tier] || 0
    const amountPerWinner = winnerCount ? Math.floor(pool / winnerCount) : 0
    const distributed = amountPerWinner * winnerCount
    remainder -= distributed
    return { tier, poolPercentage: tierPercentages[tier], poolAmount: pool, winnerCount, amountPerWinner, rolloverAmount: winnerCount ? 0 : pool }
  })
  if (remainder > 0) prizes[0].rolloverAmount += remainder
  return prizes
}