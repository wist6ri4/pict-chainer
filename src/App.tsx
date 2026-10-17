import { useCallback, useEffect, useState } from 'react'
import { setVolumes, startBgm, unlockAudio } from './lib/audio'
import { judgeLinks } from './lib/shiritori'
import {
  loadAppSettings,
  loadGameSettings,
  saveAppSettings,
  saveGameSettings,
  saveRecord,
} from './lib/storage'
import type { AppSettings, Entry, GameRecord, GameSettings, PlayMode } from './lib/types'
import { GameScreen } from './screens/GameScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ModeScreen } from './screens/ModeScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RuleScreen } from './screens/RuleScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SetupScreen } from './screens/SetupScreen'

type Screen = 'home' | 'mode' | 'rule' | 'setup' | 'game' | 'result' | 'history' | 'settings'

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [appSettings, setAppSettings] = useState<AppSettings>(loadAppSettings)
  const [gameSettings, setGameSettings] = useState<GameSettings>(loadGameSettings)
  const [record, setRecord] = useState<GameRecord | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [playMode, setPlayMode] = useState<PlayMode>('score')

  useEffect(() => {
    setVolumes(appSettings.bgm, appSettings.se)
    saveAppSettings(appSettings)
  }, [appSettings])

  // ブラウザは操作があるまで音を出せないので、最初のタップでBGMを始める
  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      startBgm()
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const startGame = (settings: GameSettings) => {
    setGameSettings(settings)
    saveGameSettings(settings)
    setGameKey((k) => k + 1)
    setScreen('game')
  }

  const finishGame = useCallback(
    (startChar: string, entries: Entry[], elapsedSec?: number) => {
      const next: GameRecord = {
        id: newId(),
        playedAt: Date.now(),
        settings: gameSettings,
        strictDakuten: gameSettings.strictDakuten,
        startChar,
        entries,
        overrides: {},
        playMode,
        elapsedSec,
      }
      setRecord(next)
      // 1まいも描かれなかったゲームは履歴に残さない
      if (entries.length > 0) void saveRecord(next).catch(() => {})
      setScreen('result')
    },
    [gameSettings, playMode],
  )

  const toggleLink = (index: number) => {
    if (!record) return
    const auto = judgeLinks(
      record.startChar,
      record.entries.map((e) => e.word),
      record.strictDakuten,
    )
    const overrides = { ...record.overrides }
    const flipped = !(overrides[index] ?? auto[index])
    if (flipped === auto[index]) delete overrides[index]
    else overrides[index] = flipped
    const next = { ...record, overrides }
    setRecord(next)
    void saveRecord(next).catch(() => {})
  }

  const goHome = () => setScreen('home')

  const selectMode = (mode: PlayMode) => {
    setPlayMode(mode)
    setScreen('setup')
  }

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          onStart={() => setScreen('mode')}
          onHistory={() => setScreen('history')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'mode' && (
        <ModeScreen
          onSelect={selectMode}
          onTimeAttack={() => setScreen('rule')}
          onBack={goHome}
        />
      )}
      {screen === 'rule' && (
        <RuleScreen onSelect={selectMode} onBack={() => setScreen('mode')} />
      )}
      {screen === 'setup' && (
        <SetupScreen
          playMode={playMode}
          initial={gameSettings}
          onStart={startGame}
          onBack={() => setScreen(playMode === 'score' ? 'mode' : 'rule')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          playMode={playMode}
          settings={gameSettings} onFinish={finishGame} onQuit={goHome} />
      )}
      {screen === 'result' && record && (
        <ResultScreen
          key={record.id}
          record={record}
          onToggle={toggleLink}
          onReplay={() => startGame(gameSettings)}
          onHome={goHome}
        />
      )}
      {screen === 'history' && <HistoryScreen onBack={goHome} />}
      {screen === 'settings' && (
        <SettingsScreen settings={appSettings} onChange={setAppSettings} onBack={goHome} />
      )}
    </div>
  )
}
