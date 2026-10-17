import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { DrawingCanvas } from '../components/DrawingCanvas'
import type { DrawingCanvasHandle } from '../components/DrawingCanvas'
import { se } from '../lib/audio'
import {
  formatTime,
  isNomissCleared,
  isTimeAttack,
  isValidWord,
  pickStartChar,
} from '../lib/shiritori'
import type { Entry, GameSettings, PlayMode } from '../lib/types'

interface Props {
  playMode: PlayMode
  settings: GameSettings
  /** elapsedSec はタイムアタックのときだけ渡される */
  onFinish: (startChar: string, entries: Entry[], elapsedSec?: number) => void
  onQuit: () => void
}

/** カタカナで入力されたぶんはひらがなに直す */
function toHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        const sentinel = await navigator.wakeLock?.request('screen')
        if (cancelled) void sentinel?.release()
        else lock = sentinel ?? null
      } catch {
        // 対応していない・許可されない場合はそのまま遊べる
      }
    }
    const onVisible = () => {
      if (!document.hidden) void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [])
}

export function GameScreen({ playMode, settings, onFinish, onQuit }: Props) {
  const timeAttack = isTimeAttack(playMode)
  const total = settings.minutes * 60
  const [startChar] = useState(() => pickStartChar())
  const [entries, setEntries] = useState<Entry[]>([])
  const [phase, setPhase] = useState<'handoff' | 'draw'>('handoff')
  const [endAt, setEndAt] = useState<number | null>(null)
  const [startAt, setStartAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(total)
  const [elapsed, setElapsed] = useState(0)
  const [word, setWord] = useState('')
  const [hasInk, setHasInk] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)

  const canvasRef = useRef<DrawingCanvasHandle>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const entriesRef = useRef(entries)
  entriesRef.current = entries
  const finished = useRef(false)

  useWakeLock()

  // タイムアタックの経過時間も開始時刻から計算する
  useEffect(() => {
    if (startAt === null) return
    const update = () => setElapsed(Math.floor((Date.now() - startAt) / 1000))
    update()
    const id = setInterval(update, 200)
    return () => clearInterval(id)
  }, [startAt])

  // 残り時間は終了時刻から計算する（バックグラウンドに回ってもずれない）
  useEffect(() => {
    if (endAt === null) return
    const update = () => {
      const left = Math.ceil((endAt - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0 && !finished.current) {
        finished.current = true
        se.timeup()
        onFinish(startChar, entriesRef.current)
      }
    }
    update()
    const id = setInterval(update, 200)
    return () => clearInterval(id)
  }, [endAt, onFinish, startChar])

  useEffect(() => {
    if (!timeAttack && endAt !== null && remaining > 0 && remaining <= 10) se.tick()
  }, [remaining, endAt, timeAttack])

  // 新しい絵が増えたら最後の絵が見える位置までスクロール
  // （縦横を切り替えたときも同じ）
  useEffect(() => {
    const scrollToLatest = () => {
      const el = stripRef.current
      if (el) el.scrollTo({ left: el.scrollWidth, top: el.scrollHeight })
    }
    scrollToLatest()
    window.addEventListener('resize', scrollToLatest)
    return () => window.removeEventListener('resize', scrollToLatest)
  }, [entries.length])

  const player = (entries.length % settings.players) + 1
  const normalized = toHiragana(word.trim())
  const wordOk = isValidWord(normalized)
  const visible = settings.showAll ? entries : entries.slice(-1)
  const offset = entries.length - visible.length

  const begin = () => {
    se.start()
    if (timeAttack) {
      if (startAt === null) setStartAt(Date.now())
    } else if (endAt === null) {
      setEndAt(Date.now() + total * 1000)
    }
    setPhase('draw')
  }

  const submit = () => {
    if (!wordOk || !hasInk || !canvasRef.current) return
    se.done()
    const image = canvasRef.current.toDataURL()
    const next = [...entries, { player, word: normalized, image }]
    setEntries(next)
    canvasRef.current.clear()
    setWord('')

    const cleared =
      playMode === 'time-penalty'
        ? next.length >= settings.players
        : playMode === 'time-nomiss' &&
          isNomissCleared(
            startChar,
            next.map((e) => e.word),
            settings.strictDakuten,
            settings.players,
          )
    if (cleared && startAt !== null && !finished.current) {
      finished.current = true
      onFinish(startChar, next, Math.floor((Date.now() - startAt) / 1000))
      return
    }
    setPhase('handoff')
  }

  const quit = () => {
    if (window.confirm('ゲームをやめてホームにもどりますか？\n（このゲームは保存されません）')) {
      finished.current = true
      onQuit()
    }
  }

  return (
    <div className="game">
      <header className="game-head">
        <Button color="white" size="sm" onClick={quit}>
          やめる
        </Button>
        <span className="turn-chip">{player}番目の人</span>
        <span
          className={`timer ${!timeAttack && remaining <= 10 ? 'is-urgent' : ''}`}
          role="timer"
        >
          {formatTime(timeAttack ? elapsed : remaining)}
        </span>
      </header>

      <section className="ref" aria-label="お題">
        {entries.length === 0 ? (
          <div className="ref-start">
            <span className="ref-caption">さいしょの文字</span>
            <span className="start-char">{startChar}</span>
            <span className="ref-caption">からはじまるものを描こう！</span>
          </div>
        ) : (
          <>
            <p className="ref-caption">この絵につなげよう！</p>
            <div className="ref-strip" ref={stripRef}>
              {settings.showAll && (
                <div className="thumb thumb-char" aria-label={`さいしょのお題だった文字 ${startChar}`}>
                  <span className="thumb-char-label">さいしょのお題</span>
                  <span className="thumb-char-value">{startChar}</span>
                </div>
              )}
              {visible.map((entry, i) => {
                const index = offset + i
                const latest = index === entries.length - 1
                return (
                  <button
                    key={index}
                    type="button"
                    className={`thumb ${latest ? 'is-latest' : ''}`}
                    aria-label={`${index + 1}まいめの絵を大きく見る`}
                    onClick={() => setZoom(entry.image)}
                  >
                    <img src={entry.image} alt="" />
                    <span className="thumb-order">{index + 1}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>

      <DrawingCanvas ref={canvasRef} onInkChange={setHasInk} />

      <form
        className="answer"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="answer-field">
          <input
            className="answer-input"
            type="text"
            lang="ja"
            value={word}
            placeholder="描いたもの（ひらがな）"
            aria-label="描いたものの名前（ひらがな）"
            aria-invalid={word !== '' && !wordOk}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            maxLength={20}
            onChange={(e) => setWord(e.target.value)}
          />
          {word !== '' && !wordOk && <span className="answer-error">ひらがなで入力してね</span>}
        </div>
        <Button color="yellow" type="submit" silent disabled={!wordOk || !hasInk}>
          完了
        </Button>
      </form>

      {zoom && (
        <div className="modal-backdrop" onClick={() => setZoom(null)}>
          <img className="zoom-image" src={zoom} alt="拡大した絵" />
        </div>
      )}

      {phase === 'handoff' && (
        <div className="modal-backdrop handoff">
          <div className="modal handoff-card" role="dialog" aria-modal="true">
            {(timeAttack ? startAt : endAt) === null ? (
              <>
                <p className="handoff-sub">じゅんびはいい？</p>
                <h2 className="handoff-title">{player}番目の人から！</h2>
                <p className="modal-note">
                  {timeAttack
                    ? 'スタートを押すとタイム計測がはじまります。'
                    : `スタートを押すと制限時間（${settings.minutes}分）がうごきだします。`}
                  <br />
                  {playMode === 'time-penalty' && `${settings.players}人ぶん描いたら終了！`}
                  {playMode === 'time-nomiss' && `${settings.players}れんさするまで終わらないよ！`}
                  {timeAttack && <br />}
                  描いたものは口に出しちゃダメ！
                </p>
                <Button color="yellow" size="lg" silent onClick={begin}>
                  スタート！
                </Button>
              </>
            ) : (
              <>
                <p className="handoff-sub">つぎの人にわたしてね</p>
                <h2 className="handoff-title">{player}番目の人の番！</h2>
                <p className="handoff-time">
                  {timeAttack ? `けいか ${formatTime(elapsed)}` : `のこり ${formatTime(remaining)}`}
                </p>
                <Button color="yellow" size="lg" silent onClick={begin}>
                  描く！
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
