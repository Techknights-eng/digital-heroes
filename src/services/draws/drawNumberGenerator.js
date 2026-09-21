import { DRAW_CONFIG } from './drawConfig.js'

export const ScoreNumberGenerator = {
  generate(score) {
    if (typeof DRAW_CONFIG.scoreNumberTransformation !== 'function') throw new Error('Score-to-draw-number transformation is not configured.')
    return DRAW_CONFIG.scoreNumberTransformation(score)
  },
}

export class RandomDrawStrategy {
  generate() {
    if (!Number.isInteger(DRAW_CONFIG.numberMin) || !Number.isInteger(DRAW_CONFIG.numberMax)) throw new Error('Draw number range is not configured.')
    const range = DRAW_CONFIG.numberMax - DRAW_CONFIG.numberMin + 1
    if (range < DRAW_CONFIG.numberCount) throw new Error('Draw number range is too small.')
    const numbers = new Set()
    while (numbers.size < DRAW_CONFIG.numberCount) numbers.add(DRAW_CONFIG.numberMin + Math.floor(Math.random() * range))
    return [...numbers].sort((a, b) => a - b)
  }
}

export class AlgorithmicDrawStrategy {
  generate() {
    throw new Error('Algorithmic draw weighting strategy is not configured.')
  }
}