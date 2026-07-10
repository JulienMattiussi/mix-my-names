import { useMemo, useState } from 'react'

const CHAR_WIDTH = 64
const SIDE_BEARING = 8
const ROW_HEIGHT = 63
const ROW_GAP = 11.2
const HEIGHT = 2 * ROW_HEIGHT + ROW_GAP
const STROKE = 9
const PADDING = STROKE

const PALETTE = [
  '#0f172a',
  '#f8fafc',
  '#f59e0b',
  '#e11d48',
  '#2563eb',
  '#16a34a',
  '#7c3aed',
  '#db2777',
]

type Point = [number, number]

const GLYPHS: Record<string, Point[][]> = {
  M: [
    [
      [0, 1],
      [0, 0],
      [0.5, 0.6],
      [1, 0],
      [1, 1],
    ],
  ],
  A: [
    [
      [0, 1],
      [0.5, 0],
      [1, 1],
    ],
    [
      [0.18, 0.62],
      [0.82, 0.62],
    ],
  ],
  S: [
    [
      [1, 0.18],
      [0.72, 0.02],
      [0.28, 0.02],
      [0, 0.22],
      [0.15, 0.45],
      [0.85, 0.55],
      [1, 0.78],
      [0.72, 0.98],
      [0.28, 0.98],
      [0, 0.82],
    ],
  ],
  C: [
    [
      [1, 0.2],
      [0.7, 0.02],
      [0.3, 0.02],
      [0, 0.25],
      [0, 0.75],
      [0.3, 0.98],
      [0.7, 0.98],
      [1, 0.8],
    ],
  ],
  H: [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0.5],
      [1, 0.5],
    ],
  ],
  T: [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1],
    ],
  ],
  R: [
    [
      [0, 1],
      [0, 0],
      [0.72, 0],
      [1, 0.18],
      [1, 0.4],
      [0.72, 0.55],
      [0, 0.55],
    ],
    [
      [0.45, 0.55],
      [1, 1],
    ],
  ],
  L: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
  ],
  E: [
    [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0.5],
      [0.7, 0.5],
    ],
  ],
  I: [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1],
    ],
    [
      [0, 1],
      [1, 1],
    ],
  ],
  N: [
    [
      [0, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ],
  ],
}

type Segment =
  | { kind: 'shared'; char: string }
  | { kind: 'gap'; top: string; bottom: string }

const SEGMENTS: Segment[] = [
  { kind: 'shared', char: 'M' },
  { kind: 'shared', char: 'A' },
  { kind: 'gap', top: 'SCH', bottom: 'R' },
  { kind: 'shared', char: 'T' },
  { kind: 'gap', top: 'ALER', bottom: 'IN' },
]

function segmentWidth(segment: Segment): number {
  if (segment.kind === 'shared') return CHAR_WIDTH
  return Math.max(segment.top.length, segment.bottom.length) * CHAR_WIDTH
}

const TOTAL_WIDTH = SEGMENTS.reduce((sum, segment) => sum + segmentWidth(segment), 0)

type Placement = { char: string; x: number; y: number; width: number; height: number; shared: boolean }

function placeRow(word: string, startX: number, totalWidth: number, y: number): Placement[] {
  const cellWidth = totalWidth / word.length
  return [...word].map((char, index) => ({
    char,
    x: startX + index * cellWidth,
    y,
    width: cellWidth,
    height: ROW_HEIGHT,
    shared: false,
  }))
}

function buildPlacements(swapped: boolean): Placement[] {
  const placements: Placement[] = []
  let cursor = 0
  for (const segment of SEGMENTS) {
    if (segment.kind === 'shared') {
      placements.push({ char: segment.char, x: cursor, y: 0, width: CHAR_WIDTH, height: HEIGHT, shared: true })
      cursor += CHAR_WIDTH
    } else {
      const top = swapped ? segment.bottom : segment.top
      const bottom = swapped ? segment.top : segment.bottom
      const width = Math.max(top.length, bottom.length) * CHAR_WIDTH
      placements.push(...placeRow(top, cursor, width, 0))
      placements.push(...placeRow(bottom, cursor, width, ROW_HEIGHT + ROW_GAP))
      cursor += width
    }
  }
  return placements
}

function Glyph({ char, x, y, width, height, color }: Omit<Placement, 'shared'> & { color: string }) {
  const polylines = GLYPHS[char]
  if (!polylines) return null
  const left = x + SIDE_BEARING
  const right = x + width - SIDE_BEARING
  return (
    <g stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {polylines.map((line, index) => (
        <polyline
          key={index}
          points={line.map(([px, py]) => `${left + px * (right - left)},${y + py * height}`).join(' ')}
        />
      ))}
    </g>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`${label} : ${color}`}
            aria-pressed={value === color}
            className={`h-6 w-6 rounded-full border border-slate-300 ${
              value === color ? 'ring-2 ring-slate-900 ring-offset-1' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [sharedColor, setSharedColor] = useState('#f59e0b')
  const [uniqueColor, setUniqueColor] = useState('#0f172a')
  const [background, setBackground] = useState('#f8fafc')
  const [swapped, setSwapped] = useState(false)

  const placements = useMemo(() => buildPlacements(swapped), [swapped])

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-8"
      style={{ backgroundColor: background }}
    >
      <aside className="absolute left-4 top-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
        <ColorField label="Lettres communes" value={sharedColor} onChange={setSharedColor} />
        <ColorField label="Autres lettres" value={uniqueColor} onChange={setUniqueColor} />
        <ColorField label="Fond" value={background} onChange={setBackground} />
        <button
          type="button"
          onClick={() => setSwapped((value) => !value)}
          aria-pressed={swapped}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Inverser les mots
        </button>
      </aside>

      <svg
        viewBox={`${-PADDING} ${-PADDING} ${TOTAL_WIDTH + 2 * PADDING} ${HEIGHT + 2 * PADDING}`}
        className="w-full max-w-4xl"
        role="img"
        aria-label="MASCHTALER et MARTIN partageant les lettres M, A et T"
      >
        {placements.map((placement, index) => (
          <Glyph
            key={index}
            char={placement.char}
            x={placement.x}
            y={placement.y}
            width={placement.width}
            height={placement.height}
            color={placement.shared ? sharedColor : uniqueColor}
          />
        ))}
      </svg>
    </main>
  )
}
