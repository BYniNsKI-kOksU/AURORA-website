import { useEffect, useRef } from 'react'

export default function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let frameId
    let stars = []

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * ratio
      canvas.height = canvas.clientHeight * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = Math.min(280, Math.max(110, Math.floor(window.innerWidth / 6)))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        radius: Math.random() * 1.35 + 0.15,
        opacity: Math.random() * 0.7 + 0.1,
        drift: Math.random() * 0.045 + 0.008,
        hue: Math.random() > 0.84 ? 215 + Math.random() * 50 : 190 + Math.random() * 35,
      }))
    }

    const draw = (time) => {
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      stars.forEach((star) => {
        const x = (star.x + (time * star.drift) / 100) % canvas.clientWidth
        const pulse = 0.7 + Math.sin(time / 900 + star.x) * 0.3
        context.beginPath()
        context.fillStyle = `hsla(${star.hue}, 100%, 85%, ${star.opacity * pulse})`
        context.arc(x, star.y, star.radius, 0, Math.PI * 2)
        context.fill()
      })
      frameId = requestAnimationFrame(draw)
    }

    resize()
    frameId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
}
