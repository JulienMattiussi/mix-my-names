import { normalizeWord } from '@/lib/text'

describe('normalizeWord', () => {
  it('uppercases and keeps only A-Z', () => {
    expect(normalizeWord('martin')).toBe('MARTIN')
    expect(normalizeWord('Kev In 42!')).toBe('KEVIN')
  })

  it('strips accents', () => {
    expect(normalizeWord('Crémé')).toBe('CREME')
    expect(normalizeWord('Éàîü')).toBe('EAIU')
  })
})
