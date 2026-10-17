/** score: 制限時間内の最大れんさ / time-penalty・time-nomiss: タイムアタック */
export type PlayMode = 'score' | 'time-penalty' | 'time-nomiss'

export interface GameSettings {
  players: number
  minutes: number
  /** 直前の人の絵以外も見えるかどうか */
  showAll: boolean
  /** 濁点・半濁点を区別して判定するか */
  strictDakuten: boolean
}

export interface Entry {
  /** 何番目の人か（1始まり） */
  player: number
  word: string
  /** PNGのdata URL */
  image: string
}

export interface GameRecord {
  id: string
  playedAt: number
  settings: GameSettings
  /** 濁点・半濁点を区別して判定したか（対局時の設定を記録） */
  strictDakuten: boolean
  startChar: string
  entries: Entry[]
  /** 手動で修正した判定。キーは絵のインデックス */
  overrides: Record<number, boolean>
  /** 省略時は 'score'（旧バージョンの履歴） */
  playMode?: PlayMode
  /** タイムアタックでかかった秒数（ペナルティ前） */
  elapsedSec?: number
}

export interface AppSettings {
  bgm: number
  se: number
}
