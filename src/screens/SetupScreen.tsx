import { useState } from 'react'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { Toggle } from '../components/Toggle'
import type { GameSettings } from '../lib/types'

interface Props {
  initial: GameSettings
  onStart: (settings: GameSettings) => void
  onBack: () => void
}

interface StepperProps {
  value: number
  min: number
  max: number
  unit: string
  label: string
  onChange: (value: number) => void
}

function Stepper({ value, min, max, unit, label, onChange }: StepperProps) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <Button
        color="white"
        size="sm"
        className="stepper-btn"
        aria-label="へらす"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </Button>
      <span className="stepper-value">
        {value}
        <small>{unit}</small>
      </span>
      <Button
        color="white"
        size="sm"
        className="stepper-btn"
        aria-label="ふやす"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        ＋
      </Button>
    </div>
  )
}

export function SetupScreen({ initial, onStart, onBack }: Props) {
  const [settings, setSettings] = useState(initial)

  return (
    <div className="screen">
      <ScreenHeader title="ゲーム設定" onBack={onBack} />

      <div className="panel">
        <div className="field">
          <span className="field-label">参加する人数</span>
          <Stepper
            label="参加する人数"
            value={settings.players}
            min={2}
            max={10}
            unit="人"
            onChange={(players) => setSettings({ ...settings, players })}
          />
        </div>
        <div className="field">
          <span className="field-label">制限時間</span>
          <Stepper
            label="制限時間"
            value={settings.minutes}
            min={1}
            max={10}
            unit="分"
            onChange={(minutes) => setSettings({ ...settings, minutes })}
          />
        </div>
        <div className="field">
          <span className="field-label">
            前の人より前の絵も見える
            <small>OFFだと直前の絵だけ見えます</small>
          </span>
          <Toggle
            label="前の人より前の絵も見える"
            checked={settings.showAll}
            onChange={(showAll) => setSettings({ ...settings, showAll })}
          />
        </div>
        <div className="field">
          <span className="field-label">
            濁点・半濁点を区別する
            <small>
              {settings.strictDakuten
                ? '「らっぱ」の次は「ぱ」だけOK'
                : '「らっぱ」の次は「は」「ば」「ぱ」でもOK'}
            </small>
          </span>
          <Toggle
            label="濁点・半濁点を区別する"
            checked={settings.strictDakuten}
            onChange={(strictDakuten) => setSettings({ ...settings, strictDakuten })}
          />
        </div>
      </div>

      <Button color="yellow" size="lg" onClick={() => onStart(settings)}>
        完了してスタート！
      </Button>
    </div>
  )
}
