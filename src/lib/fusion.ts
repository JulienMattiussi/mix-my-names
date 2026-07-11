export type Anchor = { char: string; i: number; j: number }

function parityMatches(a: number, b: number): boolean {
  return (a === 0) === (b === 0)
}

export function findFusion(word1: string, word2: string): Anchor[] {
  const matches: Anchor[] = []
  for (let i = 0; i < word1.length; i += 1) {
    for (let j = 0; j < word2.length; j += 1) {
      if (word1.charAt(i) === word2.charAt(j)) {
        matches.push({ char: word1.charAt(i), i, j })
      }
    }
  }

  const counts = matches.map(() => -1)
  const costs = matches.map(() => 0)
  const prevs = matches.map(() => -1)

  for (let m = 0; m < matches.length; m += 1) {
    const match = matches[m]!
    if (parityMatches(match.i, match.j)) {
      counts[m] = 1
      costs[m] = match.i * match.i + match.j * match.j
      prevs[m] = -1
    }
    for (let p = 0; p < m; p += 1) {
      if (counts[p]! < 0) continue
      const prev = matches[p]!
      if (prev.i >= match.i || prev.j >= match.j) continue
      const gap1 = match.i - prev.i - 1
      const gap2 = match.j - prev.j - 1
      if (!parityMatches(gap1, gap2)) continue
      const count = counts[p]! + 1
      const cost = costs[p]! + gap1 * gap1 + gap2 * gap2
      if (counts[m]! < 0 || count > counts[m]! || (count === counts[m]! && cost < costs[m]!)) {
        counts[m] = count
        costs[m] = cost
        prevs[m] = p
      }
    }
  }

  let bestCount = 0
  let bestCost = word1.length * word1.length + word2.length * word2.length
  let bestLast = -1
  for (let m = 0; m < matches.length; m += 1) {
    if (counts[m]! < 0) continue
    const match = matches[m]!
    const tail1 = word1.length - 1 - match.i
    const tail2 = word2.length - 1 - match.j
    if (!parityMatches(tail1, tail2)) continue
    const count = counts[m]!
    const cost = costs[m]! + tail1 * tail1 + tail2 * tail2
    if (count > bestCount || (count === bestCount && cost < bestCost)) {
      bestCount = count
      bestCost = cost
      bestLast = m
    }
  }

  const anchors: Anchor[] = []
  let cursor = bestLast
  while (cursor !== -1) {
    anchors.push(matches[cursor]!)
    cursor = prevs[cursor]!
  }
  return anchors.reverse()
}
