import { findFusion } from '@/lib/fusion'
import { buildLayout, HEIGHT } from '@/lib/layout'

describe('buildLayout', () => {
  it('lays out the reference MASCHTALER / MARTIN case', () => {
    const anchors = findFusion('MASCHTALER', 'MARTIN')
    const { placements, width } = buildLayout('MASCHTALER', 'MARTIN', anchors)

    const shared = placements.filter((placement) => placement.shared)
    expect(shared.map((placement) => placement.char).join('')).toBe('MAT')
    expect(shared.every((placement) => placement.height === HEIGHT)).toBe(true)

    // M + A + SCH/R + T + ALER/IN = (1 + 1 + 3 + 1 + 4) cells of 64,
    // minus the 20px kern pulled after the shared T that precedes an A.
    expect(width).toBe(10 * 64 - 20)
  })

  it('only kerns a shared T when the top word follows it with an A', () => {
    const withKern = buildLayout('MASCHTALER', 'MARTIN', findFusion('MASCHTALER', 'MARTIN'))
    const withoutKern = buildLayout('MARTIN', 'MASCHTALER', findFusion('MARTIN', 'MASCHTALER'))
    expect(withKern.width).toBe(10 * 64 - 20)
    expect(withoutKern.width).toBe(10 * 64)
  })

  it('also kerns a shared T when the top word precedes it with an A', () => {
    expect(buildLayout('AT', 'AT', findFusion('AT', 'AT')).width).toBe(2 * 64 - 20)
    expect(buildLayout('XT', 'XT', findFusion('XT', 'XT')).width).toBe(2 * 64)
  })

  it('stacks two full-width rows when nothing fuses', () => {
    const { placements, width } = buildLayout('AB', 'BA', [])
    expect(placements.some((placement) => placement.shared)).toBe(false)
    expect(width).toBe(2 * 64)
    expect(placements.filter((placement) => placement.row === 'top')).toHaveLength(2)
    expect(placements.filter((placement) => placement.row === 'bottom')).toHaveLength(2)
  })
})
