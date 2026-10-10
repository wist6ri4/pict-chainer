import { useEffect, useState } from 'react'
import { ResultView, SaveImageButton } from '../components/ResultView'
import { ScreenHeader } from '../components/ScreenHeader'
import { se } from '../lib/audio'
import { formatDate } from '../lib/resultImage'
import { recordScore } from '../lib/shiritori'
import { loadHistory } from '../lib/storage'
import type { GameRecord } from '../lib/types'

export function HistoryScreen({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<GameRecord[] | null>(null)
  const [selected, setSelected] = useState<GameRecord | null>(null)

  useEffect(() => {
    let alive = true
    void loadHistory().then((list) => {
      if (alive) setHistory(list)
    })
    return () => {
      alive = false
    }
  }, [])

  if (selected) {
    return (
      <div className="screen">
        <ScreenHeader title="履歴" onBack={() => setSelected(null)} />
        <ResultView record={selected} />
        <div className="actions">
          <SaveImageButton record={selected} />
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <ScreenHeader title="履歴" onBack={onBack} />
      <p className="hint">さいきん遊んだ5回ぶんが残ります</p>

      {history === null ? null : history.length === 0 ? (
        <div className="panel">
          <p className="empty-note">まだ遊んだ記録がありません</p>
        </div>
      ) : (
        <ul className="history-list">
          {history.map((record) => (
            <li key={record.id}>
              <button
                type="button"
                className="history-item"
                onClick={() => {
                  se.tap()
                  setSelected(record)
                }}
              >
                <img src={record.entries[0]?.image} alt="" />
                <span className="history-info">
                  <span className="history-date">{formatDate(record.playedAt)}</span>
                  <span className="history-sub">
                    {record.settings.players}人・{record.settings.minutes}分・
                    {record.entries.length}まい
                  </span>
                </span>
                <span className="history-score">
                  {recordScore(record)}
                  <small>れんさ</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
