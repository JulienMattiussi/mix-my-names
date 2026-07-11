import type { Anchor } from '@/lib/fusion'
import { findFusion } from '@/lib/fusion'

const chars = (anchors: Anchor[]) => anchors.map((anchor) => anchor.char).join('')

describe('findFusion', () => {
  it('fuses M, A and T for the reference MASCHTALER / MARTIN case', () => {
    expect(findFusion('MASCHTALER', 'MARTIN')).toEqual([
      { char: 'M', i: 0, j: 0 },
      { char: 'A', i: 1, j: 1 },
      { char: 'T', i: 5, j: 3 },
    ])
  })

  it('fuses every letter for identical words', () => {
    expect(chars(findFusion('MUNIER', 'MUNIER'))).toBe('MUNIER')
  })

  it('fuses M, N, I, R but not the misplaced U for MUNIER / MANIUR', () => {
    expect(chars(findFusion('MUNIER', 'MANIUR'))).toBe('MNIR')
  })

  it('keeps a single central letter for the reversed TRAIN / NATRI anagram', () => {
    const anchors = findFusion('TRAIN', 'NATRI')
    expect(anchors).toHaveLength(1)
    expect(anchors[0]?.char).toBe('A')
  })

  it('rejects an end letter whose other side would be empty', () => {
    expect(chars(findFusion('TRAIN', 'NATRI'))).not.toContain('I')
  })

  it('returns no fusion when the order is incompatible', () => {
    expect(findFusion('AB', 'BA')).toEqual([])
  })
})
