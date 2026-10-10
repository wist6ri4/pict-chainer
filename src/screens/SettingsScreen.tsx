import type { CSSProperties } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { se } from '../lib/audio'
import type { AppSettings } from '../lib/types'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
  onBack: () => void
}

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  onRelease?: () => void
}

function VolumeSlider({ label, value, onChange, onRelease }: SliderProps) {
  const percent = Math.round(value * 100)
  return (
    <div className="field field-column">
      <span className="field-label">
        {label}
        <span className="field-value">{percent}</span>
      </span>
      <input
        className="slider"
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        aria-label={label}
        style={{ '--fill': `${percent}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onRelease}
        onKeyUp={onRelease}
      />
    </div>
  )
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  return (
    <div className="screen">
      <ScreenHeader title="設定" onBack={onBack} />

      <div className="panel">
        <VolumeSlider
          label="BGMの音量"
          value={settings.bgm}
          onChange={(bgm) => onChange({ ...settings, bgm })}
        />
        <VolumeSlider
          label="SEの音量"
          value={settings.se}
          onChange={(v) => onChange({ ...settings, se: v })}
          onRelease={() => se.done()}
        />
      </div>
    </div>
  )
}
