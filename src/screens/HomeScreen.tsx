import { useState } from 'react'
import { Button } from '../components/Button'
import { InstallGuide } from '../components/InstallGuide'

interface Props {
  onStart: () => void
  onHistory: () => void
  onSettings: () => void
}

export function HomeScreen({ onStart, onHistory, onSettings }: Props) {
  const [guide, setGuide] = useState(false)

  return (
    <div className="screen home">
      <div className="home-hero">
        <h1 className="logo">
          <span className="logo-top">Pict</span>
          <span className="logo-bottom">Chainer</span>
        </h1>
        <p className="tagline">みんなでつなぐ 絵しりとり！</p>
      </div>

      <nav className="home-menu">
        <Button color="yellow" size="lg" onClick={onStart}>
          ゲーム開始
        </Button>
        <Button color="cyan" onClick={onHistory}>
          履歴
        </Button>
        <Button color="pink" onClick={onSettings}>
          設定
        </Button>
        <Button color="white" size="sm" onClick={() => setGuide(true)}>
          インストール方法
        </Button>
      </nav>

      {guide && <InstallGuide onClose={() => setGuide(false)} />}
    </div>
  )
}
