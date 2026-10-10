import { get, set } from 'idb-keyval'
import { pruneHistory, upsertHistory } from './history'
import type { AppSettings, GameRecord, GameSettings } from './types'

const HISTORY_KEY = 'pict-chainer:history'
const APP_SETTINGS_KEY = 'pict-chainer:settings'
const GAME_SETTINGS_KEY = 'pict-chainer:game-settings'

export const DEFAULT_APP_SETTINGS: AppSettings = { bgm: 0.5, se: 0.7 }
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  players: 4,
  minutes: 3,
  showAll: true,
  strictDakuten: true,
}

function readLocal<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 保存できなくてもプレイは続けられる
  }
}

export const loadAppSettings = () => readLocal(APP_SETTINGS_KEY, DEFAULT_APP_SETTINGS)
export const saveAppSettings = (s: AppSettings) => writeLocal(APP_SETTINGS_KEY, s)
export const loadGameSettings = () => readLocal(GAME_SETTINGS_KEY, DEFAULT_GAME_SETTINGS)
export const saveGameSettings = (s: GameSettings) => writeLocal(GAME_SETTINGS_KEY, s)

export async function loadHistory(): Promise<GameRecord[]> {
  try {
    return pruneHistory((await get<GameRecord[]>(HISTORY_KEY)) ?? [])
  } catch {
    return []
  }
}

// 書き込みを直列化して、連続した保存で古い内容に巻き戻らないようにする
let queue: Promise<unknown> = Promise.resolve()

export function saveRecord(record: GameRecord): Promise<void> {
  const task = queue.then(async () => {
    const list = (await get<GameRecord[]>(HISTORY_KEY)) ?? []
    await set(HISTORY_KEY, upsertHistory(list, record))
  })
  queue = task.catch(() => {})
  return task
}
