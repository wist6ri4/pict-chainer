import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import type { PlayMode } from '../lib/types'

interface Props {
  onSelect: (mode: PlayMode) => void
  onTimeAttack: () => void
  onBack: () => void
}

export function ModeScreen({ onSelect, onTimeAttack, onBack }: Props) {
  return (
    <div className="screen">
      <ScreenHeader title="モードをえらぶ" onBack={onBack} />

      <div className="mode-list">
        <Button color="yellow" size="lg" className="mode-card" onClick={() => onSelect('score')}>
          <span className="mode-name">スコアチャレンジ</span>
          <small className="mode-desc">制限時間のなかで、何れんさできるかを競う</small>
        </Button>
        <Button color="cyan" size="lg" className="mode-card" onClick={onTimeAttack}>
          <span className="mode-name">タイムアタック</span>
          <small className="mode-desc">人数ぶんつなげるまでのタイムを競う</small>
        </Button>
      </div>
    </div>
  )
}
