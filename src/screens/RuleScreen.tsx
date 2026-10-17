import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { PENALTY_SEC } from '../lib/shiritori'
import type { PlayMode } from '../lib/types'

interface Props {
  onSelect: (mode: PlayMode) => void
  onBack: () => void
}

export function RuleScreen({ onSelect, onBack }: Props) {
  return (
    <div className="screen">
      <ScreenHeader title="タイムアタックのルール" onBack={onBack} />

      <div className="mode-list">
        <Button
          color="yellow"
          size="lg"
          className="mode-card"
          onClick={() => onSelect('time-penalty')}
        >
          <span className="mode-name">ペナルティ制</span>
          <small className="mode-desc">
            人数ぶん描いたら終了。つながっていない絵1まいにつき＋{PENALTY_SEC}秒
          </small>
        </Button>
        <Button color="pink" size="lg" className="mode-card" onClick={() => onSelect('time-nomiss')}>
          <span className="mode-name">ノーミス制</span>
          <small className="mode-desc">外しても描きつづけ、人数ぶんつながったら終了</small>
        </Button>
      </div>
    </div>
  )
}
