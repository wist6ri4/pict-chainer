import type { GameRecord, PlayMode } from './types'

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

/** つながっていない絵1まいごとに足されるペナルティ（秒） */
export const PENALTY_SEC = 30

export const MODE_LABEL: Record<PlayMode, string> = {
  score: 'スコアチャレンジ',
  'time-penalty': 'タイムアタック（ペナルティ制）',
  'time-nomiss': 'タイムアタック（ノーミス制）',
}

export function recordMode(record: GameRecord): PlayMode {
  return record.playMode ?? 'score'
}

export function isTimeAttack(mode: PlayMode): boolean {
  return mode !== 'score'
}

/** ペナルティ制のときだけ、つながっていない絵の数×30秒 */
export function recordPenalty(record: GameRecord): number {
  if (recordMode(record) !== 'time-penalty') return 0
  return recordLinks(record).filter((ok) => !ok).length * PENALTY_SEC
}

/** タイムアタックの最終タイム（秒） */
export function recordFinalTime(record: GameRecord): number {
  return (record.elapsedSec ?? 0) + recordPenalty(record)
}

/** ノーミス制の終了判定：最大れんさが人数に届いたか */
export function isNomissCleared(
  startChar: string,
  words: string[],
  strict: boolean,
  players: number,
): boolean {
  return maxChain(judgeLinks(startChar, words, strict)) >= players
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
