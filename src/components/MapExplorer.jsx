import { useRef, useState } from 'react'
import skyMap from '../../results/aurora-sky-preview.jpg'

const INITIAL_MAP = { scale: 1, x: 0, y: 0 }

export default function MapExplorer() {
  const [map, setMap] = useState(INITIAL_MAP)
  const [isDragging, setIsDragging] = useState(false)
  const [readout, setReadout] = useState({ longitude: '000.0', latitude: '+00.0', name: 'Galactic centre' })
  const dragStart = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0 })

  const setCoordinates = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - bounds.left
    const pointerY = event.clientY - bounds.top
    const longitude = (((pointerX / bounds.width - 0.5) * 360) / map.scale - (map.x / bounds.width) * 360 + 540) % 360
    const latitude = Math.max(-90, Math.min(90, ((0.5 - pointerY / bounds.height) * 180) / map.scale + (map.y / bounds.height) * 180))
    setReadout({
      longitude: longitude.toFixed(1).padStart(5, '0'),
      latitude: `${latitude >= 0 ? '+' : ''}${latitude.toFixed(1).padStart(5, '0')}`,
      name: 'Gaia DR3 field',
    })
  }

  const handlePointerDown = (event) => {
    setIsDragging(true)
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: map.x, y: map.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    setCoordinates(event)
    if (!isDragging) return
    setMap((current) => ({
      ...current,
      x: dragStart.current.x + event.clientX - dragStart.current.pointerX,
      y: dragStart.current.y + event.clientY - dragStart.current.pointerY,
    }))
  }

  const handleWheel = (event) => {
    event.preventDefault()
    setMap((current) => ({ ...current, scale: Math.max(1, Math.min(3.2, current.scale + (event.deltaY < 0 ? 0.16 : -0.16))) }))
  }

  return (
    <article className="map-card">
      <div className="map-tools"><span className="live-dot" /> INTERACTIVE PREVIEW <button type="button" onClick={() => setMap(INITIAL_MAP)}>Reset view</button></div>
      <div
        className={`map-viewport ${isDragging ? 'is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
      >
        <img src={skyMap} alt="AURORA all-sky map of the Milky Way in Hammer projection" style={{ transform: `translate(${map.x}px, ${map.y}px) scale(${map.scale})` }} />
        <div className="crosshair" aria-hidden="true" />
        <div className="map-readout">l {readout.longitude}° &nbsp; b {readout.latitude}°<br /><b>{readout.name}</b></div>
        <p className="map-hint">Drag to explore · scroll to zoom</p>
      </div>
      <CardFooter kicker="Gaia DR3 all-sky map" title="Hammer equal-area projection" detail="16,384 × 8,192 px" />
    </article>
  )
}

export function CardFooter({ kicker, title, detail }) {
  return <div className="card-footer"><div><span className="card-kicker">{kicker}</span><h3>{title}</h3></div><span className="resolution">{detail}</span></div>
}
