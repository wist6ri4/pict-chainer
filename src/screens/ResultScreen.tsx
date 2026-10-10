import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { ResultView, SaveImageButton } from '../components/ResultView'
import { se } from '../lib/audio'
import { recordLinks } from '../lib/shiritori'
import type { GameRecord } from '../lib/types'

interface Props {
  record: GameRecord
  onToggle: (index: number) => void
  onReplay: () => void
  onHome: () => void
}

const REVEAL_INTERVAL = 1100

export function ResultScreen({ record, onToggle, onReplay, onHome }: Props) {
  const count = record.entries.length
  const [revealed, setRevealed] = useState(0)
  const done = revealed >= count

  // 1まいずつ答えをめくっていく
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => {
      ;(recordLinks(record)[revealed] ? se.ok : se.ng)()
      setRevealed(revealed + 1)
    }, REVEAL_INTERVAL)
    return () => clearTimeout(id)
    // めくっている途中で判定は変わらない
  }, [revealed, done])

  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => se.fanfare(), count > 0 ? 400 : 800)
    return () => clearTimeout(id)
  }, [done, count])

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{done ? 'けっか発表！' : '答え合わせ…'}</h1>
      </header>

      <ResultView record={record} revealed={revealed} onToggle={done ? onToggle : undefined} />

      <div className="actions">
        {done ? (
          <>
            {count > 0 && <SaveImageButton record={record} />}
            <Button color="yellow" onClick={onReplay}>
              もういちど
            </Button>
            <Button color="white" onClick={onHome}>
              ホームへ
            </Button>
          </>
        ) : (
          <Button color="white" size="sm" onClick={() => setRevealed(count)}>
            スキップ
          </Button>
        )}
      </div>
    </div>
  )
}
