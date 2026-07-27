import React, { useEffect, useRef, useState } from 'react'

export default function Counter({ value, suffix, label }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const node = ref.current
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplay(value)
      } else {
        const start = performance.now()
        const animate = (time) => {
          const progress = Math.min(1, (time - start) / 1300)
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
      observer.disconnect()
    }, { threshold: .55 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [value])

  return <div className="counter" ref={ref}><strong>{display}{suffix}</strong><span>{label}</span></div>
}
