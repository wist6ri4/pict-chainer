import { useEffect, useState } from 'react'
import { se } from '../lib/audio'
import {
  canPromptInstall,
  isIOS,
  isStandalone,
  onInstallAvailabilityChange,
  promptInstall,
} from '../lib/install'
import { Button } from './Button'

type Tab = 'ios' | 'android'

export function InstallGuide({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>(isIOS() ? 'ios' : 'android')
  const [promptable, setPromptable] = useState(canPromptInstall())

  useEffect(() => onInstallAvailabilityChange(() => setPromptable(canPromptInstall())), [])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="インストール方法"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">アプリとして使う</h2>

        {isStandalone() ? (
          <p className="modal-note">もうインストールされています！</p>
        ) : (
          <p className="modal-note">
            ホーム画面に追加すると、オフラインでも全画面で遊べます。
          </p>
        )}

        <div className="tabs" role="tablist">
          {(['ios', 'android'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`tab ${tab === t ? 'is-active' : ''}`}
              onClick={() => {
                se.tap()
                setTab(t)
              }}
            >
              {t === 'ios' ? 'iPhone / iPad' : 'Android'}
            </button>
          ))}
        </div>

        {tab === 'ios' ? (
          <ol className="steps">
            <li>
              <b>Safari</b> でこのページをひらく
            </li>
            <li>
              画面の <b>共有ボタン</b>（四角から上向きの矢印）をタップ
            </li>
            <li>
              メニューから <b>「ホーム画面に追加」</b> をえらぶ
            </li>
            <li>
              右上の <b>「追加」</b> をタップ
            </li>
          </ol>
        ) : (
          <>
            <ol className="steps">
              <li>
                <b>Chrome</b> でこのページをひらく
              </li>
              <li>
                右上の <b>メニュー（︙）</b> をタップ
              </li>
              <li>
                <b>「ホーム画面に追加」</b> または <b>「アプリをインストール」</b> をえらぶ
              </li>
              <li>
                <b>「インストール」</b> をタップ
              </li>
            </ol>
            {promptable && (
              <Button color="pink" onClick={() => void promptInstall()}>
                いますぐインストール
              </Button>
            )}
          </>
        )}

        <Button color="white" onClick={onClose}>
          とじる
        </Button>
      </div>
    </div>
  )
}
