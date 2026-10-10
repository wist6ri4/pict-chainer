import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { se } from '../lib/audio'

export const CANVAS_W = 800
export const CANVAS_H = 600

export const PALETTE = [
  { name: 'くろ', color: '#1f1f1f' },
  { name: 'グレー', color: '#9ca3af' },
  { name: 'ちゃいろ', color: '#8b5a2b' },
  { name: 'あか', color: '#ef4444' },
  { name: 'オレンジ', color: '#f97316' },
  { name: 'きいろ', color: '#facc15' },
  { name: 'きみどり', color: '#a3e635' },
  { name: 'みどり', color: '#16a34a' },
  { name: 'みずいろ', color: '#38bdf8' },
  { name: 'あお', color: '#2563eb' },
  { name: 'むらさき', color: '#9333ea' },
  { name: 'ピンク', color: '#f472b6' },
]

const SIZES = [5, 12, 26]
const ERASER_SCALE = 2.5
const BACKGROUND = '#ffffff'

interface Stroke {
  color: string
  size: number
  /** x, y を交互に並べたもの */
  points: number[]
}

export interface DrawingCanvasHandle {
  toDataURL: () => string
  clear: () => void
}

interface Props {
  onInkChange: (hasInk: boolean) => void
}

function drawStroke(c: CanvasRenderingContext2D, stroke: Stroke, from = 0) {
  const p = stroke.points
  c.strokeStyle = stroke.color
  c.fillStyle = stroke.color
  c.lineWidth = stroke.size
  c.lineCap = 'round'
  c.lineJoin = 'round'
  if (p.length === 2) {
    c.beginPath()
    c.arc(p[0], p[1], stroke.size / 2, 0, Math.PI * 2)
    c.fill()
    return
  }
  const start = Math.max(0, from - 2)
  c.beginPath()
  c.moveTo(p[start], p[start + 1])
  for (let i = start + 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1])
  c.stroke()
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { onInkChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const current = useRef<Stroke | null>(null)
  const activePointer = useRef<number | null>(null)
  const [color, setColor] = useState(PALETTE[0].color)
  const [sizeIndex, setSizeIndex] = useState(1)
  const [eraser, setEraser] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)

  const context = () => canvasRef.current!.getContext('2d')!

  const redraw = () => {
    const c = context()
    c.fillStyle = BACKGROUND
    c.fillRect(0, 0, CANVAS_W, CANVAS_H)
    strokes.current.forEach((s) => drawStroke(c, s))
  }

  const sync = () => {
    setStrokeCount(strokes.current.length)
    onInkChange(strokes.current.length > 0)
  }

  useEffect(() => {
    redraw()
    // 初回に白で塗るだけ
  }, [])

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current!.toDataURL('image/png'),
    clear: () => {
      strokes.current = []
      current.current = null
      activePointer.current = null
      redraw()
      sync()
    },
  }))

  const toCanvasPoint = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [
      ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    ]
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== null) return
    e.preventDefault()
    activePointer.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const [x, y] = toCanvasPoint(e)
    current.current = {
      color: eraser ? BACKGROUND : color,
      size: SIZES[sizeIndex] * (eraser ? ERASER_SCALE : 1),
      points: [x, y],
    }
    drawStroke(context(), current.current)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = current.current
    if (!stroke || e.pointerId !== activePointer.current) return
    e.preventDefault()
    const from = stroke.points.length
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const [x, y] = toCanvasPoint(ev)
      stroke.points.push(x, y)
    }
    drawStroke(context(), stroke, from)
  }

  const onPointerEnd = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointer.current) return
    activePointer.current = null
    if (current.current) {
      strokes.current.push(current.current)
      current.current = null
      sync()
    }
  }

  const undo = () => {
    se.tap()
    strokes.current.pop()
    redraw()
    sync()
  }

  const clearAll = () => {
    se.tap()
    strokes.current = []
    redraw()
    sync()
  }

  return (
    <>
      <div className="canvas-area">
        <div className="canvas-frame">
          <canvas
            ref={canvasRef}
            className="draw-canvas"
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          />
        </div>
      </div>

      <div className="tools">
        <div className="palette" role="radiogroup" aria-label="ペンの色">
          {PALETTE.map((p) => (
            <button
              key={p.color}
              type="button"
              role="radio"
              aria-checked={!eraser && color === p.color}
              aria-label={p.name}
              className={`swatch ${!eraser && color === p.color ? 'is-active' : ''}`}
              style={{ background: p.color }}
              onClick={() => {
                se.tap()
                setColor(p.color)
                setEraser(false)
              }}
            />
          ))}
        </div>
        <div className="tool-row">
          <div className="sizes" role="radiogroup" aria-label="ペンの太さ">
            {SIZES.map((s, i) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={sizeIndex === i}
                aria-label={['ほそい', 'ふつう', 'ふとい'][i]}
                className={`tool-btn size-btn ${sizeIndex === i ? 'is-active' : ''}`}
                onClick={() => {
                  se.tap()
                  setSizeIndex(i)
                }}
              >
                <span
                  className="size-dot"
                  style={{ width: 6 + i * 6, height: 6 + i * 6, background: eraser ? '#9ca3af' : color }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={eraser}
            className={`tool-btn ${eraser ? 'is-active' : ''}`}
            onClick={() => {
              se.tap()
              setEraser(!eraser)
            }}
          >
            けしゴム
          </button>
          <button type="button" className="tool-btn" onClick={undo} disabled={strokeCount === 0}>
            もどす
          </button>
          <button type="button" className="tool-btn" onClick={clearAll} disabled={strokeCount === 0}>
            ぜんぶけす
          </button>
        </div>
      </div>
    </>
  )
})
