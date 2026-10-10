import { describe, expect, it } from 'vitest'
import {
  headChar,
  isValidWord,
  judgeLinks,
  maxChain,
  pickStartChar,
  recordScore,
  START_CHARS,
  tailChar,
} from './shiritori'
import { pruneHistory, upsertHistory } from './history'
import type { GameRecord } from './types'

describe('isValidWord', () => {
  it('ひらがなと長音だけを受け付ける', () => {
    expect(isValidWord('りんご')).toBe(true)
    expect(isValidWord('こーひー')).toBe(true)
    expect(isValidWord('')).toBe(false)
    expect(isValidWord('リンゴ')).toBe(false)
    expect(isValidWord('apple')).toBe(false)
    expect(isValidWord('ーあ')).toBe(false)
    expect(isValidWord('りん ご')).toBe(false)
  })
})

describe('tailChar / headChar', () => {
  it('末尾の長音は直前の文字を使う', () => {
    expect(tailChar('こーひー', true)).toBe('ひ')
    expect(tailChar('ばたー', true)).toBe('た')
  })
  it('小さい文字は大きい文字として扱う', () => {
    expect(tailChar('きしゃ', true)).toBe('や')
    expect(tailChar('らっぱっ', true)).toBe('つ')
    expect(headChar('ゃ', true)).toBe('や')
  })
  it('濁点の区別は設定で切り替わる', () => {
    expect(tailChar('らっぱ', true)).toBe('ぱ')
    expect(tailChar('らっぱ', false)).toBe('は')
    expect(headChar('ばなな', false)).toBe('は')
    expect(headChar('ゔぁいおりん', false)).toBe('う')
  })
})

describe('judgeLinks', () => {
  it('お題の文字から順につながりを判定する', () => {
    expect(judgeLinks('り', ['りんご', 'ごりら', 'らっぱ', 'ぱんだ'], true)).toEqual([
      true, true, true, true,
    ])
    expect(judgeLinks('り', ['すいか', 'かめ'], true)).toEqual([false, true])
  })
  it('濁点を区別する場合は「は」と「ぱ」はつながらない', () => {
    expect(judgeLinks('ら', ['らっぱ', 'はさみ'], true)).toEqual([true, false])
    expect(judgeLinks('ら', ['らっぱ', 'はさみ'], false)).toEqual([true, true])
  })
  it('「ん」で終わると次へはつながらない', () => {
    expect(judgeLinks('み', ['みかん', 'んじゃめな', 'なす'], true)).toEqual([true, false, true])
  })
  it('長音と小さい文字でつながる', () => {
    expect(judgeLinks('こ', ['こーひー', 'ひこうき', 'きしゃ', 'やかん'], true)).toEqual([
      true, true, true, true,
    ])
  })
})

describe('maxChain', () => {
  it('連続した最大数を数える', () => {
    expect(maxChain([])).toBe(0)
    expect(maxChain([false, false])).toBe(0)
    expect(maxChain([true, true, false, true, true, true, false])).toBe(3)
    expect(maxChain([true, true, true])).toBe(3)
  })
})

describe('recordScore', () => {
  const base: GameRecord = {
    id: 'a',
    playedAt: 0,
    settings: { players: 2, minutes: 3, showAll: true, strictDakuten: true },
    strictDakuten: true,
    startChar: 'ら',
    entries: [
      { player: 1, word: 'らっぱ', image: '' },
      { player: 2, word: 'はさみ', image: '' },
      { player: 1, word: 'みかん', image: '' },
    ],
    overrides: {},
  }
  it('手動修正がスコアに反映される', () => {
    expect(recordScore(base)).toBe(1)
    expect(recordScore({ ...base, overrides: { 1: true } })).toBe(3)
    expect(recordScore({ ...base, overrides: { 0: false } })).toBe(1)
  })
  it('対局時の濁点設定で判定する', () => {
    expect(recordScore({ ...base, strictDakuten: false })).toBe(3)
  })
})

describe('pickStartChar', () => {
  it('「ん」「を」や小さい文字は出ない', () => {
    expect(START_CHARS).not.toContain('ん')
    expect(START_CHARS).not.toContain('を')
    expect(pickStartChar(() => 0)).toBe('あ')
    expect(pickStartChar(() => 0.9999)).toBe('わ')
  })
})

describe('history', () => {
  const rec = (id: string, playedAt: number): GameRecord => ({
    id,
    playedAt,
    settings: { players: 2, minutes: 3, showAll: true, strictDakuten: true },
    strictDakuten: true,
    startChar: 'あ',
    entries: [],
    overrides: {},
  })
  it('新しい順に5件だけ残す', () => {
    const list = [1, 2, 3, 4, 5, 6, 7].map((n) => rec(String(n), n))
    expect(pruneHistory(list).map((r) => r.id)).toEqual(['7', '6', '5', '4', '3'])
  })
  it('6回目を追加すると一番古い1件が消える', () => {
    let list: GameRecord[] = []
    for (let n = 1; n <= 6; n++) list = upsertHistory(list, rec(String(n), n))
    expect(list.map((r) => r.id)).toEqual(['6', '5', '4', '3', '2'])
  })
  it('同じIDは上書きされ件数は増えない', () => {
    let list = upsertHistory([], rec('a', 1))
    list = upsertHistory(list, { ...rec('a', 1), overrides: { 0: true } })
    expect(list).toHaveLength(1)
    expect(list[0].overrides).toEqual({ 0: true })
  })
})
