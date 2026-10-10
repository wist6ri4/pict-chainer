import type { GameRecord } from './types'

const SMALL_TO_LARGE: Record<string, string> = {
  ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お',
  っ: 'つ', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ',
  ゕ: 'か', ゖ: 'け',
}

const DAKUTEN_FROM = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔ'
const DAKUTEN_TO = 'かきくけこさしすせそたちつてとはひふへほはひふへほう'

/** お題として出す最初の文字の候補 */
export const START_CHARS = [
  ...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわ',
]

export function pickStartChar(random: () => number = Math.random): string {
  return START_CHARS[Math.floor(random() * START_CHARS.length)]
}

/** ひらがな（と長音）だけで、しりとりに使える単語かどうか */
export function isValidWord(word: string): boolean {
  return /^[ぁ-ゖ][ぁ-ゖー]*$/.test(word)
}

/** 小さい文字を大きい文字にし、strict でなければ濁点・半濁点も外す */
export function normalizeChar(char: string, strict: boolean): string {
  let c = SMALL_TO_LARGE[char] ?? char
  if (!strict) {
    const i = DAKUTEN_FROM.indexOf(c)
    if (i >= 0) c = DAKUTEN_TO[i]
  }
  return c
}

export function headChar(word: string, strict: boolean): string {
  return normalizeChar(word.charAt(0), strict)
}

/** 末尾の長音は飛ばして、その前の文字を返す */
export function tailChar(word: string, strict: boolean): string {
  const trimmed = word.replace(/ー+$/, '')
  return normalizeChar(trimmed.charAt(trimmed.length - 1), strict)
}

/**
 * 各単語が前の単語（1つ目はお題の文字）と正しくつながっているかを返す。
 * 「ん」で終わった単語の次はつながらない。
 */
export function judgeLinks(startChar: string, words: string[], strict: boolean): boolean[] {
  return words.map((word, i) => {
    if (!isValidWord(word)) return false
    const prev = i === 0 ? normalizeChar(startChar, strict) : tailChar(words[i - 1], strict)
    if (prev === 'ん') return false
    return headChar(word, strict) === prev
  })
}

/** 正しくつながった絵が連続した最大数 */
export function maxChain(links: boolean[]): number {
  let best = 0
  let run = 0
  for (const ok of links) {
    run = ok ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

/** 自動判定に手動修正を重ねた最終的な判定 */
export function recordLinks(record: GameRecord): boolean[] {
  const auto = judgeLinks(
    record.startChar,
    record.entries.map((e) => e.word),
    record.strictDakuten,
  )
  return auto.map((ok, i) => record.overrides[i] ?? ok)
}

export function recordScore(record: GameRecord): number {
  return maxChain(recordLinks(record))
}
