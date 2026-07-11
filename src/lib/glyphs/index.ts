import type { GlyphPaths } from './types'
import A from './A'
import B from './B'
import C from './C'
import D from './D'
import E from './E'
import F from './F'
import G from './G'
import H from './H'
import I from './I'
import J from './J'
import K from './K'
import L from './L'
import M from './M'
import N from './N'
import O from './O'
import P from './P'
import Q from './Q'
import R from './R'
import S from './S'
import T from './T'
import U from './U'
import V from './V'
import W from './W'
import X from './X'
import Y from './Y'
import Z from './Z'

export const GLYPHS: Record<string, GlyphPaths> = {
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
}

export type Trait = { x1: number; y1: number; x2: number; y2: number }

export function lowestTrait(paths: GlyphPaths): Trait | null {
  let best: { ax: number; ay: number; bx: number; by: number; midY: number; len: number } | null = null
  for (const line of paths) {
    for (let k = 0; k + 1 < line.length; k += 1) {
      const a = line[k]!
      const b = line[k + 1]!
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (len === 0) continue
      const midY = (a[1] + b[1]) / 2
      if (!best || midY > best.midY || (midY === best.midY && len > best.len)) {
        best = { ax: a[0], ay: a[1], bx: b[0], by: b[1], midY, len }
      }
    }
  }
  if (!best) return null
  const horizontal = Math.abs(best.bx - best.ax) >= Math.abs(best.by - best.ay)
  const flip = horizontal ? best.ax > best.bx : best.ay > best.by
  return flip
    ? { x1: best.bx, y1: best.by, x2: best.ax, y2: best.ay }
    : { x1: best.ax, y1: best.ay, x2: best.bx, y2: best.by }
}
