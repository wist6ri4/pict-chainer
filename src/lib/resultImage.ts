import { recordLinks, recordScore } from './shiritori'
import type { GameRecord } from './types'

const FONT = '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", system-ui, sans-serif'
const NAVY = '#2a1a5e'

const W = 1080
const PAD = 48
const COLS = 3
const GAP = 24
const CARD_W = (W - PAD * 2 - GAP * (COLS - 1)) / COLS
const IMG_H = (CARD_W * 3) / 4
const CARD_H = IMG_H + 84
const HEADER_H = 430

export function formatDate(time: number): string {
  const d = new Date(time)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function outlinedText(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  stroke = NAVY,
  width = 14,
) {
  c.lineJoin = 'round'
  c.lineWidth = width
  c.strokeStyle = stroke
  c.strokeText(text, x, y)
  c.fillStyle = fill
  c.fillText(text, x, y)
}

/** 入りきらない文字列は末尾を「…」にする */
function fitText(c: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (c.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && c.measureText(t + '…').width > maxWidth) t = t.slice(0, -1)
  return t + '…'
}

export async function renderResultImage(record: GameRecord): Promise<Blob> {
  const links = recordLinks(record)
  const score = recordScore(record)
  const rows = Math.max(1, Math.ceil(record.entries.length / COLS))
  const H = HEADER_H + rows * (CARD_H + GAP) + PAD + 40

  // 使う文字のフォントを先に読み込む（unicode-rangeで分割されているため）
  const allText =
    'Pict Chainer最大れんさ！さいしょの文字「」人分まだ絵がありません0123456789/:○×' +
    record.startChar +
    record.entries.map((e) => e.word).join('')
  try {
    await document.fonts.load(`800 40px ${FONT}`, allText)
  } catch {
    // 読み込めなければ代替フォントで描く
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!

  const bg = c.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#7b4dff')
  bg.addColorStop(1, '#ff4fa3')
  c.fillStyle = bg
  c.fillRect(0, 0, W, H)
  c.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = 30; y < H; y += 90) {
    for (let x = (Math.floor(y / 90) % 2) * 45 + 20; x < W; x += 90) {
      c.beginPath()
      c.arc(x, y, 12, 0, Math.PI * 2)
      c.fill()
    }
  }

  c.textAlign = 'center'
  c.textBaseline = 'middle'

  c.font = `800 84px ${FONT}`
  outlinedText(c, 'Pict Chainer', W / 2, 96, '#ffd23f', NAVY, 20)

  c.font = `800 30px ${FONT}`
  c.fillStyle = '#ffffff'
  c.fillText(
    `${formatDate(record.playedAt)}　${record.settings.players}人　${record.settings.minutes}分`,
    W / 2,
    172,
  )

  // スコア
  roundRect(c, PAD, 214, W - PAD * 2, 130, 65)
  c.fillStyle = '#ffffff'
  c.fill()
  c.lineWidth = 8
  c.strokeStyle = NAVY
  c.stroke()
  c.font = `800 44px ${FONT}`
  const label1 = '最大 '
  const label2 = ' れんさ！'
  c.font = `800 96px ${FONT}`
  const numW = c.measureText(String(score)).width
  c.font = `800 44px ${FONT}`
  const w1 = c.measureText(label1).width
  const w2 = c.measureText(label2).width
  let x = (W - (w1 + numW + w2)) / 2
  c.textAlign = 'left'
  c.fillStyle = NAVY
  c.fillText(label1, x, 284)
  x += w1
  c.font = `800 96px ${FONT}`
  outlinedText(c, String(score), x, 280, '#ff4fa3', NAVY, 12)
  x += numW
  c.font = `800 44px ${FONT}`
  c.fillStyle = NAVY
  c.fillText(label2, x, 284)

  c.textAlign = 'center'
  c.font = `800 34px ${FONT}`
  c.fillStyle = '#ffffff'
  c.fillText(`さいしょの文字「${record.startChar}」`, W / 2, 388)

  if (record.entries.length === 0) {
    c.font = `800 40px ${FONT}`
    c.fillText('まだ絵がありません', W / 2, HEADER_H + CARD_H / 2)
  }

  const images = await Promise.all(record.entries.map((e) => loadImage(e.image)))
  record.entries.forEach((entry, i) => {
    const cx = PAD + (i % COLS) * (CARD_W + GAP)
    const cy = HEADER_H + Math.floor(i / COLS) * (CARD_H + GAP)

    roundRect(c, cx, cy, CARD_W, CARD_H, 28)
    c.fillStyle = '#ffffff'
    c.fill()
    c.save()
    roundRect(c, cx, cy, CARD_W, CARD_H, 28)
    c.clip()
    c.drawImage(images[i], cx, cy, CARD_W, IMG_H)
    c.fillStyle = links[i] ? '#d9fbe5' : '#ffe1e6'
    c.fillRect(cx, cy + IMG_H, CARD_W, CARD_H - IMG_H)
    c.restore()
    roundRect(c, cx, cy, CARD_W, CARD_H, 28)
    c.lineWidth = 7
    c.strokeStyle = NAVY
    c.stroke()

    c.font = `800 40px ${FONT}`
    c.fillStyle = NAVY
    c.textAlign = 'center'
    c.fillText(fitText(c, entry.word, CARD_W - 110), cx + CARD_W / 2 + 26, cy + IMG_H + 44)

    // ○×バッジ
    c.beginPath()
    c.arc(cx + 46, cy + IMG_H + 42, 28, 0, Math.PI * 2)
    c.fillStyle = links[i] ? '#22c55e' : '#ef4444'
    c.fill()
    c.lineWidth = 5
    c.strokeStyle = NAVY
    c.stroke()
    c.font = `800 34px ${FONT}`
    c.fillStyle = '#ffffff'
    c.fillText(links[i] ? '○' : '×', cx + 46, cy + IMG_H + 43)

    // 順番
    c.beginPath()
    c.arc(cx + 34, cy + 34, 24, 0, Math.PI * 2)
    c.fillStyle = '#ffd23f'
    c.fill()
    c.lineWidth = 5
    c.strokeStyle = NAVY
    c.stroke()
    c.font = `800 26px ${FONT}`
    c.fillStyle = NAVY
    c.fillText(String(i + 1), cx + 34, cy + 35)
  })

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

/** 結果画像を保存する。スマホでは共有シート、それ以外はダウンロード。 */
export async function saveResultImage(record: GameRecord): Promise<void> {
  const blob = await renderResultImage(record)
  const d = new Date(record.playedAt)
  const p = (n: number) => String(n).padStart(2, '0')
  const name = `pict-chainer-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`
  const file = new File([blob], name, { type: 'image/png' })

  const isTouch = window.matchMedia('(pointer: coarse)').matches
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Pict Chainer' })
      return
    } catch (e) {
      // キャンセルは何もしない。それ以外はダウンロードにフォールバック
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
