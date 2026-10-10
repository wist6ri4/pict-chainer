import { se } from '../lib/audio'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={() => {
        se.tap()
        onChange(!checked)
      }}
    >
      <span className="toggle-knob" />
      <span className="toggle-text">{checked ? 'ON' : 'OFF'}</span>
    </button>
  )
}
