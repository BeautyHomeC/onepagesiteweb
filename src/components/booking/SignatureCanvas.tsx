'use client'
import { useRef, useEffect, useCallback } from 'react'

interface Props {
  onChange: (dataUrl: string | null) => void
}

export default function SignatureCanvas({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const source = 'touches' in e ? e.touches[0] : e
    return { x: source.clientX - rect.left, y: source.clientY - rect.top }
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    drawing.current = true
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [])

  const endDraw = useCallback(() => {
    drawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
  }, [onChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1b1c1c'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', endDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', endDraw)
    }
  }, [startDraw, draw, endDraw])

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full border border-outline-variant bg-white touch-none"
        style={{ cursor: 'crosshair' }}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs text-on-surface-variant hover:text-error underline font-label-caps uppercase tracking-widest"
      >
        Effacer
      </button>
    </div>
  )
}
