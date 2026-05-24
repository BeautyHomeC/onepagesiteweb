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
    // Scale CSS coordinates to canvas coordinate space (canvas.width may differ from CSS width)
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (source.clientX - rect.left) * scaleX,
      y: (source.clientY - rect.top) * scaleY,
    }
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
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

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
        width={560}
        height={140}
        className="w-full border border-outline-variant bg-surface-container-lowest touch-none"
        style={{ cursor: 'crosshair', display: 'block' }}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-hanken)' }}>
          Dessinez votre signature ci-dessus
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-[10px] text-on-surface-variant/60 hover:text-error transition-colors uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          Effacer
        </button>
      </div>
    </div>
  )
}
