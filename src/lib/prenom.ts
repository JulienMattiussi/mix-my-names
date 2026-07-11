export type PrenomMatch = {
  remainder: string
  junctionIndex: number
  start: number
  length: number
}

function occursNonCommon(word: string, sub: string, common: Set<number>): number {
  if (sub.length === 0) return -1
  for (let start = 0; start + sub.length <= word.length; start += 1) {
    let ok = true
    for (let offset = 0; offset < sub.length; offset += 1) {
      const at = start + offset
      if (common.has(at) || word.charAt(at) !== sub.charAt(offset)) {
        ok = false
        break
      }
    }
    if (ok) return start
  }
  return -1
}

function longestEnd(word: string, prenom: string, common: Set<number>, fromStart: boolean): [number, number] {
  for (let length = prenom.length; length >= 1; length -= 1) {
    const sub = fromStart ? prenom.slice(0, length) : prenom.slice(prenom.length - length)
    const start = occursNonCommon(word, sub, common)
    if (start !== -1) return [length, start]
  }
  return [0, -1]
}

export function matchPrenom(word: string, prenom: string, common: Set<number>): PrenomMatch | null {
  const [prefixLen, prefixStart] = longestEnd(word, prenom, common, true)
  const [suffixLen, suffixStart] = longestEnd(word, prenom, common, false)

  const usePrefix = prefixLen >= suffixLen
  const matchedLen = usePrefix ? prefixLen : suffixLen
  if (matchedLen === 0 || matchedLen >= prenom.length) return null

  if (usePrefix) {
    return {
      remainder: prenom.slice(prefixLen),
      junctionIndex: prefixStart + prefixLen - 1,
      start: prefixStart,
      length: prefixLen,
    }
  }
  return {
    remainder: prenom.slice(0, prenom.length - suffixLen),
    junctionIndex: suffixStart,
    start: suffixStart,
    length: suffixLen,
  }
}
