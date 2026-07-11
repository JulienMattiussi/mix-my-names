import { useMemo, useState } from 'react'
import { findFusion } from '@/lib/fusion'
import { buildLayout, HEIGHT, SIDE_BEARING, STROKE, type Placement } from '@/lib/layout'
import { GLYPHS, lowestTrait, type Trait } from '@/lib/glyphs'
import { matchPrenom, type PrenomMatch } from '@/lib/prenom'
import { normalizeWord } from '@/lib/text'

const INSCRIPTION_FONT_RATIO = 0.75
const INSCRIPTION_MARGIN = 11
const INSCRIPTION_MAX_CHAR_WIDTH = 8

type Inscription = { placement: Placement; trait: Trait; word: string }

function traitInfo(placement: Placement, trait: Trait) {
  const inkLeft = placement.x + SIDE_BEARING
  const inkRight = placement.x + placement.width - SIDE_BEARING
  const ax = inkLeft + trait.x1 * (inkRight - inkLeft)
  const ay = placement.y + trait.y1 * placement.height
  const bx = inkLeft + trait.x2 * (inkRight - inkLeft)
  const by = placement.y + trait.y2 * placement.height
  const length = Math.hypot(bx - ax, by - ay)
  const horizontal = Math.abs(by - ay) < 0.5
  const margin = horizontal || length === 0 ? 0 : INSCRIPTION_MARGIN
  const usable = Math.max(1, length - 2 * margin)
  const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
  const startX = length === 0 ? ax : ax + ((bx - ax) / length) * margin
  const startY = length === 0 ? ay : ay + ((by - ay) / length) * margin
  return { angle, usable, startX, startY }
}

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

const HEIGHT_GRADIENT_ID = 'height-split'

type ColorMode = 'letter' | 'height' | 'prenom'
const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: 'letter', label: 'Lettre' },
  { id: 'height', label: 'Hauteur' },
  { id: 'prenom', label: 'Prénom' },
]

function Glyph({
  char,
  x,
  y,
  width,
  height,
  color,
}: {
  char: string
  x: number
  y: number
  width: number
  height: number
  color: string
}) {
  const paths = GLYPHS[char]
  if (!paths) return null
  const left = x + SIDE_BEARING
  const right = x + width - SIDE_BEARING
  return (
    <g stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((line, index) => (
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

function WordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (word: string) => void
}) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm uppercase focus:border-slate-500 focus:outline-none"
      />
    </label>
  )
}

function InscribedWord({
  inscription,
  charWidth,
  color,
}: {
  inscription: Inscription
  charWidth: number
  color: string
}) {
  const { placement, trait, word } = inscription
  const { angle, startX, startY } = traitInfo(placement, trait)
  const width = word.length * charWidth
  return (
    <text
      transform={`translate(${startX} ${startY}) rotate(${angle})`}
      textAnchor="start"
      dominantBaseline="central"
      fontFamily="ui-monospace, monospace"
      fontWeight="bold"
      fontSize={charWidth * INSCRIPTION_FONT_RATIO}
      fill={color}
      textLength={width}
      lengthAdjust="spacingAndGlyphs"
    >
      {word}
    </text>
  )
}

export default function App() {
  const [wordA, setWordA] = useState('DURONT')
  const [wordB, setWordB] = useState('MARTIN')
  const [prenomTop, setPrenomTop] = useState('JEAN')
  const [prenomBottom, setPrenomBottom] = useState('MARIE')
  const [swapped, setSwapped] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('prenom')
  const [sharedColor, setSharedColor] = useState('#f59e0b')
  const [uniqueColor, setUniqueColor] = useState('#0f172a')
  const [topColor, setTopColor] = useState('#f59e0b')
  const [bottomColor, setBottomColor] = useState('#2563eb')
  const [topNameColor, setTopNameColor] = useState('#e11d48')
  const [bottomNameColor, setBottomNameColor] = useState('#2563eb')
  const [otherColor, setOtherColor] = useState('#16a34a')
  const [background, setBackground] = useState('#f8fafc')

  const topWord = normalizeWord(swapped ? wordB : wordA)
  const bottomWord = normalizeWord(swapped ? wordA : wordB)
  const topName = normalizeWord(prenomTop)
  const bottomName = normalizeWord(prenomBottom)

  const anchors = useMemo(() => findFusion(topWord, bottomWord), [topWord, bottomWord])
  const { placements, width } = useMemo(
    () => buildLayout(topWord, bottomWord, anchors),
    [topWord, bottomWord, anchors],
  )

  const topMatch = useMemo(
    () => (topName ? matchPrenom(topWord, topName, new Set(anchors.map((a) => a.i))) : null),
    [topWord, topName, anchors],
  )
  const bottomMatch = useMemo(
    () => (bottomName ? matchPrenom(bottomWord, bottomName, new Set(anchors.map((a) => a.j))) : null),
    [bottomWord, bottomName, anchors],
  )

  const inscriptions = useMemo<Inscription[]>(() => {
    const result: Inscription[] = []
    const add = (match: PrenomMatch | null, key: 'topIndex' | 'bottomIndex') => {
      if (!match || match.remainder.length === 0) return
      const placement = placements.find((item) => item[key] === match.junctionIndex)
      if (!placement) return
      const trait = lowestTrait(GLYPHS[placement.char] ?? [])
      if (!trait) return
      result.push({ placement, trait, word: match.remainder })
    }
    add(topMatch, 'topIndex')
    add(bottomMatch, 'bottomIndex')
    return result
  }, [topMatch, bottomMatch, placements])

  const inscriptionCharWidth = useMemo(() => {
    let charWidth = Infinity
    for (const inscription of inscriptions) {
      if (inscription.word.length === 0) continue
      const { usable } = traitInfo(inscription.placement, inscription.trait)
      charWidth = Math.min(charWidth, usable / inscription.word.length)
    }
    return Number.isFinite(charWidth) ? Math.min(charWidth, INSCRIPTION_MAX_CHAR_WIDTH) : 0
  }, [inscriptions])

  const inMatch = (match: PrenomMatch | null, index: number | undefined): boolean =>
    match !== null && index !== undefined && index >= match.start && index < match.start + match.length

  const colorFor = (placement: Placement): string => {
    if (colorMode === 'letter') return placement.shared ? sharedColor : uniqueColor
    if (colorMode === 'height') {
      if (placement.row === 'top') return topColor
      if (placement.row === 'bottom') return bottomColor
      return `url(#${HEIGHT_GRADIENT_ID})`
    }
    if (inMatch(topMatch, placement.topIndex)) return topNameColor
    if (inMatch(bottomMatch, placement.bottomIndex)) return bottomNameColor
    return otherColor
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-8"
      style={{ backgroundColor: background }}
    >
      <aside className="absolute left-4 top-4 flex w-72 flex-col gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-700">Haut</div>
          <div className="flex gap-2">
            <WordField label="Nom" value={swapped ? wordB : wordA} onChange={swapped ? setWordB : setWordA} />
            <WordField label="Prénom" value={prenomTop} onChange={setPrenomTop} />
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-700">Bas</div>
          <div className="flex gap-2">
            <WordField label="Nom" value={swapped ? wordA : wordB} onChange={swapped ? setWordA : setWordB} />
            <WordField label="Prénom" value={prenomBottom} onChange={setPrenomBottom} />
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Mode de couleur</div>
          <div className="flex gap-1">
            {COLOR_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setColorMode(mode.id)}
                aria-pressed={colorMode === mode.id}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium ${
                  colorMode === mode.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {colorMode === 'letter' && (
          <>
            <ColorField label="Lettres communes" value={sharedColor} onChange={setSharedColor} />
            <ColorField label="Autres lettres" value={uniqueColor} onChange={setUniqueColor} />
          </>
        )}
        {colorMode === 'height' && (
          <>
            <ColorField label="Nom du haut" value={topColor} onChange={setTopColor} />
            <ColorField label="Nom du bas" value={bottomColor} onChange={setBottomColor} />
          </>
        )}
        {colorMode === 'prenom' && (
          <>
            <ColorField label={topName || 'Prénom du haut'} value={topNameColor} onChange={setTopNameColor} />
            <ColorField label={bottomName || 'Prénom du bas'} value={bottomNameColor} onChange={setBottomNameColor} />
            <ColorField label="Autres lettres" value={otherColor} onChange={setOtherColor} />
          </>
        )}
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

      {width > 0 && (
        <svg
          viewBox={`${-STROKE} ${-STROKE} ${width + 2 * STROKE} ${HEIGHT + 2 * STROKE}`}
          className="w-full max-w-4xl"
          role="img"
          aria-label={`${topWord} et ${bottomWord}`}
        >
          <defs>
            <linearGradient id={HEIGHT_GRADIENT_ID} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={HEIGHT}>
              <stop offset="0.5" stopColor={topColor} />
              <stop offset="0.5" stopColor={bottomColor} />
            </linearGradient>
          </defs>
          {placements.map((placement, index) => (
            <Glyph
              key={index}
              char={placement.char}
              x={placement.x}
              y={placement.y}
              width={placement.width}
              height={placement.height}
              color={colorFor(placement)}
            />
          ))}
          {inscriptions.map((inscription, index) => (
            <InscribedWord
              key={index}
              inscription={inscription}
              charWidth={inscriptionCharWidth}
              color={background}
            />
          ))}
        </svg>
      )}
    </main>
  )
}
