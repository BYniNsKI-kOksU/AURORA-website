import React, { useMemo, useRef, useState } from 'react'

const INITIAL_MAP = { scale: 1, x: 0, y: 0 }

function mockSource(longitude, latitude) {
  const seed = Math.abs(Math.sin(longitude * 12.9898 + latitude * 78.233))
  return {
    sourceId: `${Math.floor(4.0e18 + seed * 3.7e18)}`,
    temperature: `${Math.round(3400 + seed * 8100).toLocaleString()} K`,
    magnitude: (6.8 + seed * 10.4).toFixed(2),
    longitude: `${longitude.toFixed(4)}°`,
    latitude: `${latitude >= 0 ? '+' : ''}${latitude.toFixed(4)}°`,
    distance: `${(120 + seed * 12400).toLocaleString(undefined, { maximumFractionDigits: 0 })} pc`,
  }
}

export default function MapExplorer() {
  const [map, setMap] = useState(INITIAL_MAP)
  const [isDragging, setIsDragging] = useState(false)
  const [coordinates, setCoordinates] = useState({ longitude: 0, latitude: 0 })
  const dragStart = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0 })
  const source = useMemo(() => mockSource(coordinates.longitude, coordinates.latitude), [coordinates])

  const coordinatesFor = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - bounds.left
    const py = event.clientY - bounds.top
    const longitude = (((px / bounds.width - .5) * 360) / map.scale - (map.x / bounds.width) * 360 + 540) % 360
    const latitude = Math.max(-90, Math.min(90, ((.5 - py / bounds.height) * 180) / map.scale + (map.y / bounds.height) * 180))
    return { longitude, latitude }
  }

  const handlePointerDown = (event) => {
    setIsDragging(true)
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: map.x, y: map.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!isDragging) return
    setMap((current) => ({ ...current, x: dragStart.current.x + event.clientX - dragStart.current.pointerX, y: dragStart.current.y + event.clientY - dragStart.current.pointerY }))
  }

  const handleWheel = (event) => {
    event.preventDefault()
    setMap((current) => ({ ...current, scale: Math.max(1, Math.min(4, current.scale + (event.deltaY < 0 ? .18 : -.18))) }))
  }

  const selectSource = (event) => {
    if (Math.abs(map.x - dragStart.current.x) > 3 || Math.abs(map.y - dragStart.current.y) > 3) return
    setCoordinates(coordinatesFor(event))
  }

  const reset = () => { setMap(INITIAL_MAP); setCoordinates({ longitude: 0, latitude: 0 }) }

  return (
    <div className="sky-explorer">
      <div className="sky-toolbar"><span><i /> LIVE PREVIEW / HAMMER PROJECTION</span><div><button type="button" onClick={() => setMap((current) => ({ ...current, scale: Math.max(1, current.scale - .2) }))} aria-label="Zoom out">−</button><output>{Math.round(map.scale * 100)}%</output><button type="button" onClick={() => setMap((current) => ({ ...current, scale: Math.min(4, current.scale + .2) }))} aria-label="Zoom in">+</button><button type="button" onClick={reset}>Reset</button></div></div>
      <div className="sky-layout">
        <div className={`sky-viewport ${isDragging ? 'is-dragging' : ''}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={(event) => { setIsDragging(false); selectSource(event) }} onPointerCancel={() => setIsDragging(false)} onWheel={handleWheel}>
          <img src="/assets/aurora-sky-preview.jpg" alt="AURORA all-sky Milky Way map in Hammer projection" draggable="false" style={{ transform: `translate3d(${map.x}px, ${map.y}px, 0) scale(${map.scale})` }} />
          <div className="crosshair" aria-hidden="true"><i /></div>
          <p className="sky-hint">Drag to navigate · select a source · scroll to zoom</p>
        </div>
        <aside className="source-panel" aria-live="polite">
          <div className="source-heading"><span>SELECTED SOURCE</span><i /></div>
          <h3>Gaia DR3 field</h3>
          <dl>
            <div><dt>source_id</dt><dd>{source.sourceId}</dd></div>
            <div><dt>Temperature</dt><dd>{source.temperature}</dd></div>
            <div><dt>G magnitude</dt><dd>{source.magnitude}</dd></div>
            <div><dt>Galactic longitude</dt><dd>{source.longitude}</dd></div>
            <div><dt>Galactic latitude</dt><dd>{source.latitude}</dd></div>
            <div><dt>Distance</dt><dd>{source.distance}</dd></div>
          </dl>
          <p>Representative preview data</p>
        </aside>
      </div>
    </div>
  )
}
