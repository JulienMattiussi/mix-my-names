import { matchPrenom } from '@/lib/prenom'

describe('matchPrenom', () => {
  it('matches ALE as a prefix and leaves XANDRA on the E', () => {
    // MASCHTALER fuses M(0), A(1), T(5) with MARTIN
    expect(matchPrenom('MASCHTALER', 'ALEXANDRA', new Set([0, 1, 5]))).toEqual({
      remainder: 'XANDRA',
      junctionIndex: 8,
      start: 6,
      length: 3,
    })
  })

  it('matches IN as a suffix and leaves KEV on the I', () => {
    // MARTIN fuses M(0), A(1), T(3) with MASCHTALER
    expect(matchPrenom('MARTIN', 'KEVIN', new Set([0, 1, 3]))).toEqual({
      remainder: 'KEV',
      junctionIndex: 4,
      start: 4,
      length: 2,
    })
  })

  it('ignores common letters when searching', () => {
    // the leading A (index 1) is common, so ALEXANDRA cannot anchor on it
    const match = matchPrenom('MASCHTALER', 'ALEXANDRA', new Set([0, 1, 5]))
    expect(match?.junctionIndex).toBe(8)
  })

  it('returns null when nothing matches', () => {
    expect(matchPrenom('MARTIN', 'ZOE', new Set([0, 1, 3]))).toBeNull()
  })
})
