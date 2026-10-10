// BGM・SEはすべてWeb Audioで合成する（音声ファイルを持たないのでオフラインでも軽い）

let ctx: AudioContext | null = null
let bgmGain: GainNode | null = null
let seGain: GainNode | null = null
let volumes = { bgm: 0.5, se: 0.7 }

const BGM_LEVEL = 0.22
const SE_LEVEL = 0.6

function applyVolumes() {
  if (!ctx || !bgmGain || !seGain) return
  bgmGain.gain.setTargetAtTime(volumes.bgm * BGM_LEVEL, ctx.currentTime, 0.02)
  seGain.gain.setTargetAtTime(volumes.se * SE_LEVEL, ctx.currentTime, 0.02)
}

export function setVolumes(bgm: number, se: number) {
  volumes = { bgm, se }
  applyVolumes()
}

/** ユーザー操作のタイミングで呼び、音を出せる状態にする */
export function unlockAudio() {
  if (!ctx) {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    bgmGain = ctx.createGain()
    seGain = ctx.createGain()
    bgmGain.gain.value = volumes.bgm * BGM_LEVEL
    seGain.gain.value = volumes.se * SE_LEVEL
    bgmGain.connect(ctx.destination)
    seGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume()
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return
  if (document.hidden) void ctx.suspend()
  else void ctx.resume()
})

const midiToFreq = (m: number) => 440 * 2 ** ((m - 69) / 12)

function tone(
  dest: GainNode,
  type: OscillatorType,
  freq: number,
  start: number,
  duration: number,
  peak: number,
  slideTo?: number,
) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(dest)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

let noiseBuffer: AudioBuffer | null = null

function hat(dest: GainNode, start: number, peak: number) {
  if (!ctx) return
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 6000
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(peak, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05)
  src.connect(filter).connect(gain).connect(dest)
  src.start(start)
  src.stop(start + 0.06)
}

// ---- BGM ----------------------------------------------------------------

const STEP = 60 / 140 / 2 // 8分音符の長さ（秒）

// 8小節ループ。0は休符。コード進行は C - Am - F - G
const MELODY = [
  72, 76, 79, 76, 72, 76, 79, 84,
  69, 72, 76, 72, 69, 72, 76, 81,
  65, 69, 72, 69, 77, 76, 72, 69,
  67, 71, 74, 71, 79, 77, 74, 71,
  84, 0, 79, 0, 76, 79, 84, 0,
  81, 0, 76, 0, 72, 76, 81, 0,
  77, 76, 77, 81, 84, 0, 81, 0,
  79, 77, 74, 71, 74, 77, 79, 0,
]
const BASS = [36, 33, 29, 31, 36, 33, 29, 31]

let bgmTimer: number | null = null
let nextStepTime = 0
let stepIndex = 0

function scheduleStep(index: number, time: number) {
  if (!bgmGain) return
  const note = MELODY[index % MELODY.length]
  if (note) tone(bgmGain, 'square', midiToFreq(note), time, STEP * 0.9, 0.22)

  const inBar = index % 8
  const root = BASS[Math.floor(index / 8) % BASS.length]
  if (inBar % 2 === 0) {
    const bass = inBar % 4 === 0 ? root : root + 12
    tone(bgmGain, 'triangle', midiToFreq(bass), time, STEP * 1.6, 0.6)
  } else {
    hat(bgmGain, time, 0.18)
  }
}

export function startBgm() {
  if (!ctx || bgmTimer !== null) return
  nextStepTime = ctx.currentTime + 0.1
  bgmTimer = window.setInterval(() => {
    if (!ctx || ctx.state !== 'running') return
    // 止まっていた間のぶんをまとめて鳴らさない
    if (nextStepTime < ctx.currentTime) nextStepTime = ctx.currentTime + 0.05
    while (nextStepTime < ctx.currentTime + 0.25) {
      scheduleStep(stepIndex, nextStepTime)
      stepIndex++
      nextStepTime += STEP
    }
  }, 60)
}

export function stopBgm() {
  if (bgmTimer !== null) {
    clearInterval(bgmTimer)
    bgmTimer = null
  }
}

// ---- SE -----------------------------------------------------------------

function seq(type: OscillatorType, notes: number[], step: number, duration: number, peak = 0.5) {
  if (!ctx || !seGain) return
  const now = ctx.currentTime
  notes.forEach((n, i) => tone(seGain!, type, midiToFreq(n), now + i * step, duration, peak))
}

export const se = {
  tap: () => seq('triangle', [84], 0, 0.08, 0.5),
  start: () => seq('square', [72, 76, 79, 84], 0.08, 0.14, 0.35),
  done: () => seq('square', [79, 84, 88], 0.07, 0.14, 0.35),
  tick: () => seq('square', [93], 0, 0.06, 0.3),
  timeup: () => seq('sawtooth', [76, 72, 67, 60], 0.16, 0.3, 0.35),
  reveal: () => seq('triangle', [76, 81], 0.06, 0.12, 0.5),
  ok: () => seq('square', [84, 91], 0.07, 0.12, 0.3),
  ng: () => {
    if (!ctx || !seGain) return
    tone(seGain, 'sawtooth', 220, ctx.currentTime, 0.3, 0.35, 110)
  },
  fanfare: () => seq('square', [72, 72, 72, 76, 79, 76, 79, 84], 0.11, 0.22, 0.35),
}
