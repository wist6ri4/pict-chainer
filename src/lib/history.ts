import type { GameRecord } from './types'

export const HISTORY_LIMIT = 5

/** 新しい順に並べ、上限を超えた古いデータを捨てる */
export function pruneHistory(list: GameRecord[], limit = HISTORY_LIMIT): GameRecord[] {
  return [...list].sort((a, b) => b.playedAt - a.playedAt).slice(0, limit)
}

/** 同じIDがあれば置き換え、なければ追加する */
export function upsertHistory(list: GameRecord[], record: GameRecord): GameRecord[] {
  return pruneHistory([record, ...list.filter((r) => r.id !== record.id)])
}
