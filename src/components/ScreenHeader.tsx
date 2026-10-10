import { Button } from './Button'

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="screen-header">
      <Button color="white" size="sm" onClick={onBack} aria-label="もどる">
        ← もどる
      </Button>
      <h1 className="screen-title">{title}</h1>
    </header>
  )
}
