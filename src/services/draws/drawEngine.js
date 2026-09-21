export function calculateMatchCount(entryNumbers = [], winningNumbers = []) {
  const winning = new Set(winningNumbers)
  return [...new Set(entryNumbers)].filter((number) => winning.has(number)).length
}

export function getPrizeTier(matchCount) {
  return [5, 4, 3].includes(matchCount) ? matchCount : null
}