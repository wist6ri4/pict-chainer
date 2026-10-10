import { useState } from 'react'
import { se } from '../lib/audio'
import { formatDate, saveResultImage } from '../lib/resultImage'
import { recordLinks, recordScore } from '../lib/shiritori'
import type { GameRecord } from '../lib/types'
import { Button } from './Button'

interface Props {
  record: GameRecord
  /** 何枚目まで答えを見せるか。省略すると全部 */
  revealed?: number
  /** 渡すと○×をタップで修正できる */
  onToggle?: (index: number) => void
}

export function ResultView({ record, revealed = record.entries.length, onToggle }: Props) {
  const links = recordLinks(record)
  const done = revealed >= record.entries.length

  return (
    <div className="result">
      <p className="result-meta">
        {formatDate(record.playedAt)}・{record.settings.players}人・{record.settings.minutes}分
      </p>

      <div className={`score-panel ${done ? 'is-done' : ''}`}>
        <span className="score-label">最大</span>
        <span className="score-number">{done ? recordScore(record) : '?'}</span>
        <span className="score-label">れんさ！</span>
      </div>

      <p className="result-start">
        さいしょの文字 <span className="char-chip">{record.startChar}</span>
      </p>

      {record.entries.length === 0 && <p className="empty-note">絵が1まいもありませんでした…</p>}

      <ol className="result-grid">
        {record.entries.map((entry, i) => {
          const shown = i < revealed
          const ok = links[i]
          return (
            <li key={i} className={`result-card ${shown ? (ok ? 'is-ok' : 'is-ng') : ''}`}>
              <span className="card-order">{i + 1}</span>
              <img src={entry.image} alt={shown ? entry.word : `${i + 1}まいめの絵`} />
              <div className="card-foot">
                {shown ? (
                  <>
                    {onToggle ? (
                      <button
                        type="button"
                        className={`mark ${ok ? 'mark-ok' : 'mark-ng'}`}
                        aria-label={`${ok ? 'つながっている' : 'つながっていない'}（タップで変更）`}
                        onClick={() => {
                          ;(ok ? se.ng : se.ok)()
                          onToggle(i)
                        }}
                      >
                        {ok ? '○' : '×'}
                      </button>
                    ) : (
                      <span className={`mark ${ok ? 'mark-ok' : 'mark-ng'}`}>{ok ? '○' : '×'}</span>
                    )}
                    <span className="card-word">{entry.word}</span>
                  </>
                ) : (
                  <span className="card-word is-hidden">？？？</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {done && onToggle && record.entries.length > 0 && (
        <p className="hint">○×をタップすると判定をなおせるよ</p>
      )}
    </div>
  )
}

export function SaveImageButton({ record }: { record: GameRecord }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const save = async () => {
    setBusy(true)
    setFailed(false)
    try {
      await saveResultImage(record)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button color="cyan" onClick={save} disabled={busy}>
        {busy ? 'つくっています…' : '画像として保存'}
      </Button>
      {failed && <p className="error-note">画像を保存できませんでした</p>}
    </>
  )
}
