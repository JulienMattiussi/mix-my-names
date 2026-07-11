import type { Anchor } from './fusion'

const CHAR_WIDTH = 64
const ROW_HEIGHT = 63
const ROW_GAP = 11.2

export const SIDE_BEARING = 8
export const STROKE = 9
export const HEIGHT = 2 * ROW_HEIGHT + ROW_GAP

type Row = 'top' | 'bottom' | 'full'

export type Placement = {
  char: string
  x: number
  y: number
  width: number
  height: number
  shared: boolean
  row: Row
  topIndex?: number
  bottomIndex?: number
}

const BOTTOM_Y = ROW_HEIGHT + ROW_GAP
const T_BEFORE_A_KERN = 20

function kernAfterAnchor(anchorChar: string, nextTopChar: string): number {
  if (anchorChar === 'T' && nextTopChar === 'A') return -T_BEFORE_A_KERN
  return 0
}

function kernBeforeAnchor(anchorChar: string, prevTopChar: string): number {
  if (anchorChar === 'T' && prevTopChar === 'A') return -T_BEFORE_A_KERN
  return 0
}

function placeRun(
  word: string,
  startX: number,
  totalWidth: number,
  y: number,
  row: Row,
  indexBase: number,
): Placement[] {
  if (word.length === 0) return []
  const cellWidth = totalWidth / word.length
  return [...word].map((char, index) => ({
    char,
    x: startX + index * cellWidth,
    y,
    width: cellWidth,
    height: ROW_HEIGHT,
    shared: false,
    row,
    topIndex: row === 'top' ? indexBase + index : undefined,
    bottomIndex: row === 'bottom' ? indexBase + index : undefined,
  }))
}

export function buildLayout(
  topWord: string,
  bottomWord: string,
  anchors: Anchor[],
): { placements: Placement[]; width: number } {
  const placements: Placement[] = []
  let cursor = 0
  let topFrom = 0
  let bottomFrom = 0

  const pushGap = (top: string, bottom: string, topBase: number, bottomBase: number) => {
    if (top.length === 0 && bottom.length === 0) return
    const width = Math.max(top.length, bottom.length) * CHAR_WIDTH
    placements.push(...placeRun(top, cursor, width, 0, 'top', topBase))
    placements.push(...placeRun(bottom, cursor, width, BOTTOM_Y, 'bottom', bottomBase))
    cursor += width
  }

  for (const anchor of anchors) {
    pushGap(topWord.slice(topFrom, anchor.i), bottomWord.slice(bottomFrom, anchor.j), topFrom, bottomFrom)
    cursor += kernBeforeAnchor(anchor.char, topWord.charAt(anchor.i - 1))
    placements.push({
      char: anchor.char,
      x: cursor,
      y: 0,
      width: CHAR_WIDTH,
      height: HEIGHT,
      shared: true,
      row: 'full',
      topIndex: anchor.i,
      bottomIndex: anchor.j,
    })
    cursor += CHAR_WIDTH
    topFrom = anchor.i + 1
    bottomFrom = anchor.j + 1
    cursor += kernAfterAnchor(anchor.char, topWord.charAt(topFrom))
  }
  pushGap(topWord.slice(topFrom), bottomWord.slice(bottomFrom), topFrom, bottomFrom)

  return { placements, width: cursor }
}
