import React, { useEffect, useMemo, useRef, useState } from 'react'

const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 800
const INITIAL_VIEW = { scale: 0.5, x: 0, y: 0, minScale: 0.5 }

const filters = [
  ['all', 'All events'],
  ['strong', 'Strong A ≥ 2'],
  ['short', 'Short ≤ 30 d'],
  ['long', 'Long ≥ 100 d'],
]

const format = (value, digits = 1) => value == null
  ? '—'
  : new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits }).format(value)

const formatDistance = (value) => {
  if (value == null) return '—'
  return value >= 1000 ? `${format(value / 1000, 2)} kpc` : `${format(value, 0)} pc`
}

const formatMass = (event) => {
  if (event.lensMass == null) return 'Undetermined'
  const digits = event.lensMass < .01 ? 5 : event.lensMass < .1 ? 3 : event.lensMass < 10 ? 2 : 1
  return `${event.massIsEstimated ? '≈ ' : ''}${format(event.lensMass, digits)} M☉`
}

const amplification = (tau, u0) => {
  const uSquared = Math.max(1e-24, u0 * u0 + tau * tau)
  return (uSquared + 2) / Math.sqrt(uSquared * (uSquared + 4))
}

function eventMatches(event, filter, query) {
  const filterMatches = filter === 'all'
    || (filter === 'strong' && event.aMax >= 2)
    || (filter === 'short' && event.te <= 30)
    || (filter === 'long' && event.te >= 100)
  const normalizedQuery = query.trim().replace(/[–—]/g, '-').toLowerCase()
  if (!normalizedQuery) return filterMatches
  return filterMatches && (
    String(event.sourceId).includes(normalizedQuery)
    || event.name.replace(/[–—]/g, '-').toLowerCase().includes(normalizedQuery)
  )
}

export default function MapExplorer() {
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState(INITIAL_VIEW)
  const [dragging, setDragging] = useState(false)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const viewportRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetch('/assets/microlensing-events.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setPayload(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError('The microlensing catalogue could not be loaded.')
      })
    return () => { cancelled = true }
  }, [])

  const fitMap = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    const minScale = Math.min(viewport.clientWidth / WORLD_WIDTH, viewport.clientHeight / WORLD_HEIGHT) * .96
    setView({
      minScale,
      scale: minScale,
      x: (viewport.clientWidth - WORLD_WIDTH * minScale) / 2,
      y: (viewport.clientHeight - WORLD_HEIGHT * minScale) / 2,
    })
  }

  useEffect(() => {
    if (!payload) return undefined
    fitMap()
    const observer = new ResizeObserver(fitMap)
    if (viewportRef.current) observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [payload])

  useEffect(() => {
    if (!selected) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelected(null)
    }
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selected])

  const visibleEvents = useMemo(() => {
    if (!payload) return []
    return payload.events.filter((event) => eventMatches(event, filter, query))
  }, [filter, payload, query])

  const visibleKeys = useMemo(() => new Set(visibleEvents.map((event) => event.key)), [visibleEvents])

  const clampView = (next) => {
    const viewport = viewportRef.current
    if (!viewport) return next
    const width = WORLD_WIDTH * next.scale
    const height = WORLD_HEIGHT * next.scale
    const margin = 70
    return {
      ...next,
      x: width <= viewport.clientWidth
        ? (viewport.clientWidth - width) / 2
        : Math.min(margin, Math.max(viewport.clientWidth - width - margin, next.x)),
      y: height <= viewport.clientHeight
        ? (viewport.clientHeight - height) / 2
        : Math.min(margin, Math.max(viewport.clientHeight - height - margin, next.y)),
    }
  }

  const zoomAt = (factor, clientX, clientY) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const bounds = viewport.getBoundingClientRect()
    const anchorX = clientX - bounds.left
    const anchorY = clientY - bounds.top
    setView((current) => {
      const scale = Math.min(current.minScale * 20, Math.max(current.minScale, current.scale * factor))
      const worldX = (anchorX - current.x) / current.scale
      const worldY = (anchorY - current.y) / current.scale
      return clampView({
        ...current,
        scale,
        x: anchorX - worldX * scale,
        y: anchorY - worldY * scale,
      })
    })
  }

  const zoomFromCentre = (factor) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const bounds = viewport.getBoundingClientRect()
    zoomAt(factor, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
  }

  const handlePointerDown = (event) => {
    if (event.target.closest('.event-marker')) return
    setDragging(true)
    setHovered(null)
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: view.x,
      y: view.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragging || !dragRef.current) return
    const deltaX = event.clientX - dragRef.current.pointerX
    const deltaY = event.clientY - dragRef.current.pointerY
    setView((current) => clampView({
      ...current,
      x: dragRef.current.x + deltaX,
      y: dragRef.current.y + deltaY,
    }))
  }

  const endDrag = () => {
    setDragging(false)
    dragRef.current = null
  }

  const showTooltip = (event, lensingEvent) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const bounds = viewport.getBoundingClientRect()
    setHovered(lensingEvent)
    setHoverPosition({
      x: Math.min(bounds.width - 270, Math.max(12, event.clientX - bounds.left + 18)),
      y: Math.min(bounds.height - 175, Math.max(72, event.clientY - bounds.top + 18)),
    })
  }

  const focusEvent = (event) => {
    const viewport = viewportRef.current
    if (!viewport) return
    setView((current) => {
      const scale = Math.max(current.minScale * 5, current.scale)
      return clampView({
        ...current,
        scale,
        x: viewport.clientWidth / 2 - event.x * WORLD_WIDTH * scale,
        y: viewport.clientHeight / 2 - event.y * WORLD_HEIGHT * scale,
      })
    })
  }

  if (loadError) return <div className="map-loading map-error" role="alert">{loadError}</div>
  if (!payload) return <div className="map-loading" role="status"><span className="map-loader" /> Calibrating 218 Gaia events…</div>

  return (
    <div className="microlensing-atlas">
      <div className="atlas-toolbar">
        <div className="atlas-status"><i /> GAIA DR3 / LIVE EVENT ATLAS</div>
        <label className="atlas-search">
          <span className="sr-only">Search by AURORA event name or Gaia source ID</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search event or Gaia source ID"
          />
          <kbd>/</kbd>
        </label>
        <p><strong>{visibleEvents.length}</strong> / {payload.meta.count} events</p>
      </div>

      <div className="atlas-viewport" ref={viewportRef}>
        <div
          className={`atlas-canvas ${dragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={(event) => {
            event.preventDefault()
            zoomAt(Math.exp(-event.deltaY * .0015), event.clientX, event.clientY)
          }}
          onDoubleClick={(event) => zoomAt(1.7, event.clientX, event.clientY)}
        >
          <div
            className="atlas-world"
            style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
          >
            <img src="/assets/aurora-sky-preview.jpg" alt="AURORA all-sky Milky Way map in Hammer projection" draggable="false" />
            <div className="atlas-grid" aria-hidden="true">
              <span className="atlas-equator" />
              <span className="atlas-meridian" />
              <span className="atlas-outline" />
            </div>
            <div className="event-markers">
              {payload.events.map((event) => {
                const isVisible = visibleKeys.has(event.key)
                return (
                  <button
                    type="button"
                    key={event.key}
                    className={`event-marker ${event.aMax >= 2 ? 'is-strong' : ''} ${isVisible ? '' : 'is-muted'}`}
                    style={{
                      left: event.x * WORLD_WIDTH,
                      top: event.y * WORLD_HEIGHT,
                      '--marker-compensation': 1 / view.scale,
                    }}
                    aria-label={`${event.name}, peak on ${event.date.date}`}
                    tabIndex={isVisible ? 0 : -1}
                    onPointerEnter={(pointerEvent) => showTooltip(pointerEvent, event)}
                    onPointerMove={(pointerEvent) => showTooltip(pointerEvent, event)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={(focusEvent) => showTooltip(focusEvent, event)}
                    onBlur={() => setHovered(null)}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation()
                      setSelected(event)
                    }}
                    onDoubleClick={(doubleClickEvent) => {
                      doubleClickEvent.stopPropagation()
                      focusEvent(event)
                    }}
                  >
                    <span />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="atlas-map-tools" aria-label="Map controls">
            <button type="button" onClick={() => zoomFromCentre(1.55)} aria-label="Zoom in">+</button>
            <button type="button" onClick={() => zoomFromCentre(1 / 1.55)} aria-label="Zoom out">−</button>
            <button type="button" onClick={fitMap} aria-label="Reset map">⌾</button>
          </div>

          <div className="atlas-legend" aria-hidden="true">
            <span>Strong A ≥ 2 <i className="strong" /></span>
            <span>A &lt; 2 <i /></span>
          </div>

          <div className="atlas-zoom">ZOOM <strong>{(view.scale / view.minScale).toFixed(2)}×</strong></div>

          {hovered && (
            <EventTooltip event={hovered} position={hoverPosition} total={payload.meta.count} />
          )}
        </div>
      </div>

      <div className="atlas-footer">
        <div className="atlas-filters" role="group" aria-label="Filter microlensing events">
          {filters.map(([key, label]) => (
            <button type="button" key={key} className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <p>Drag to navigate · scroll to zoom · select an event for the physical model</p>
      </div>

      <div className="atlas-meta" aria-label="Catalogue summary">
        <div><span>Catalogue span</span><strong>{payload.meta.dateStart} → {payload.meta.dateEnd}</strong></div>
        <div><span>Median tE</span><strong>{format(payload.meta.medianTimescale, 1)} days</strong></div>
        <div><span>Strong events</span><strong>{payload.meta.strongCount}</strong></div>
        <div><span>Projection</span><strong>Hammer / galactic</strong></div>
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} onFocus={() => { setSelected(null); focusEvent(selected) }} />}
    </div>
  )
}

function EventTooltip({ event, position, total }) {
  return (
    <div className="event-tooltip" role="tooltip" style={{ left: position.x, top: position.y }}>
      <div className="event-tooltip-head">
        <div><span>Event {event.catalogIndex}/{total}</span><strong>{event.name}</strong></div>
        <b>A {format(event.aMax, 2)}×</b>
      </div>
      <dl>
        <div><dt>Peak</dt><dd>{event.date.date}</dd></div>
        <div><dt>Timescale</dt><dd>{format(event.te, 1)} days</dd></div>
        <div><dt>Source</dt><dd>{event.gMag == null ? '—' : `${format(event.gMag, 2)} mag`}</dd></div>
        <div><dt>Position</dt><dd>l {format(event.l, 1)}° · b {format(event.b, 1)}°</dd></div>
      </dl>
      <p>Select to open the event model →</p>
    </div>
  )
}

function EventDetail({ event, onClose, onFocus }) {
  const [tau, setTau] = useState(0)
  const currentAmplification = amplification(tau, event.u0)

  return (
    <div className="event-dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" onMouseDown={(mouseEvent) => {
      if (mouseEvent.target === mouseEvent.currentTarget) onClose()
    }}>
      <article className="event-sheet">
        <button className="event-close" type="button" onClick={onClose} aria-label="Close event details">×</button>
        <section className="event-visual">
          <div className="event-visual-head"><span>Third-person lensing geometry</span><strong>PSPL / PACZYŃSKI</strong></div>
          <LensingDiagram event={event} tau={tau} />
          <div className="event-timeline">
            <div><label htmlFor="event-time">Time from peak</label><output>{tau >= 0 ? '+' : ''}{format(tau, 2)} tE · A = {format(currentAmplification, 2)}×</output></div>
            <input id="event-time" type="range" min="-3" max="3" step=".01" value={tau} onChange={(inputEvent) => setTau(Number(inputEvent.target.value))} />
          </div>
        </section>
        <section className="event-panel">
          <p className="event-index">Event card {event.catalogIndex} / 218</p>
          <h3 id="event-dialog-title">{event.name}</h3>
          <p className="event-source-id">Gaia DR3 {event.sourceId}</p>
          <div className="event-hero-stats">
            <div><span>Peak amplification</span><strong>{format(event.aMax, 2)}×</strong></div>
            <div><span>Timescale tE</span><strong>{format(event.te, 1)} d</strong></div>
            <div><span>Impact u₀</span><strong>{format(event.u0, 3)}</strong></div>
          </div>

          <EventSection title="Time and position">
            <DataRow label="Approximate peak date (UTC)" value={event.date.date} />
            <DataRow label="Peak time, BJD(TCB)" value={format(event.date.bjd, 5)} />
            <DataRow label="Galactic longitude l" value={`${format(event.l, 5)}°`} />
            <DataRow label="Galactic latitude b" value={`${format(event.b, 5)}°`} />
          </EventSection>

          <EventSection title="Lensing object">
            <div className="lens-summary">
              <strong>{event.lensHypothesis || event.lensKind || 'Unresolved foreground object'}</strong>
              <p>{event.lensInferenceNote || 'Gaia detects the characteristic brightening, but does not directly identify the foreground lens.'}</p>
            </div>
            <div className="lens-categories">
              {['black-hole', 'neutron-star', 'free-floating-planet'].map((category) => (
                <span key={category} className={event.lensCategory === category ? 'is-active' : ''}>
                  {{ 'black-hole': 'Black hole', 'neutron-star': 'Neutron star', 'free-floating-planet': 'Free-floating planet' }[category]}
                </span>
              ))}
            </div>
            <DataRow label="Lens mass" value={formatMass(event)} />
            <DataRow label="Model confidence" value={event.lensConfidenceLabel || '—'} />
            <DataRow label="Fit model" value="Point source + point lens" />
            {event.massEstimateNote && <p className="event-model-note">{event.massEstimateNote}</p>}
          </EventSection>

          <EventSection title="Lensed source star">
            <div className="source-star">
              <i style={{ background: event.sourceColor?.css || '#d8efff' }} />
              <div><strong>{event.sourceDescription}</strong><span>{event.temperature == null ? 'Temperature unavailable' : `${format(event.temperature, 0)} K`}</span></div>
            </div>
            <DataRow label="Gaia G magnitude" value={event.gMag == null ? '—' : `${format(event.gMag, 3)} mag`} />
            <DataRow label="Parallax" value={event.parallax == null ? '—' : `${format(event.parallax, 4)} mas`} />
            <DataRow label="Indicative distance 1/ϖ" value={formatDistance(event.distancePc)} />
            <DataRow label="Colour BP−RP" value={event.bpRp == null ? '—' : `${format(event.bpRp, 3)} mag`} />
          </EventSection>

          <EventSection title="Paczyński light curve">
            <PaczynskiCurve event={event} tau={tau} />
          </EventSection>

          <p className="event-science-note">The geometry is normalised to the Einstein radius. Source and observer remain fixed while the lens moves across the line of sight in the thin-lens, point-source model.</p>
          <div className="event-actions">
            <button type="button" onClick={() => navigator.clipboard?.writeText(event.sourceId)}>Copy Gaia ID</button>
            <button type="button" onClick={onFocus}>Show on map</button>
          </div>
        </section>
      </article>
    </div>
  )
}

function EventSection({ title, children }) {
  return <section className="event-data-section"><h4>{title}</h4>{children}</section>
}

function DataRow({ label, value }) {
  return <div className="event-data-row"><span>{label}</span><strong>{value}</strong></div>
}

function PaczynskiCurve({ event, tau }) {
  const width = 520
  const height = 140
  const pad = { left: 34, right: 12, top: 14, bottom: 26 }
  const peak = Math.max(1.15, Math.min(event.aMax, 10))
  const points = Array.from({ length: 181 }, (_, index) => {
    const curveTau = -3 + 6 * index / 180
    const value = Math.min(amplification(curveTau, event.u0), peak)
    const x = pad.left + (width - pad.left - pad.right) * index / 180
    const y = pad.top + (height - pad.top - pad.bottom) * (1 - (value - 1) / (peak - 1))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const cursorX = pad.left + (width - pad.left - pad.right) * (tau + 3) / 6

  return (
    <svg className="paczynski-curve" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Paczyński microlensing light curve">
      {[0, 1, 2, 3, 4].map((row) => {
        const y = pad.top + (height - pad.top - pad.bottom) * row / 4
        return <line key={row} x1={pad.left} y1={y} x2={width - pad.right} y2={y} />
      })}
      <polyline points={points} />
      <line className="curve-cursor" x1={cursorX} y1={pad.top} x2={cursorX} y2={height - pad.bottom} />
      <text x={pad.left} y={height - 7}>−3 tE</text>
      <text x={width - pad.right} y={height - 7} textAnchor="end">+3 tE</text>
      <text className="curve-value" x={width - pad.right} y={pad.top + 10} textAnchor="end">A {format(amplification(tau, event.u0), 2)}×</text>
    </svg>
  )
}

function LensingDiagram({ event, tau }) {
  const sourceColour = event.sourceColor?.css || '#d9f0ff'
  const u = Math.sqrt(event.u0 * event.u0 + tau * tau)
  const currentAmplification = amplification(tau, event.u0)
  const lensX = 445 + tau * 62
  const lensY = 290 + Math.max(-1.5, Math.min(1.5, event.u0)) * 22
  const arcSpan = 16 + 152 * Math.exp(-u * 2.7)
  const ringOpacity = Math.max(.2, Math.min(1, 1.2 - u))

  return (
    <svg className="lensing-diagram" viewBox="0 0 900 560" role="img" aria-label={`Microlensing geometry for ${event.name}`}>
      <defs>
        <radialGradient id="source-halo">
          <stop offset="0" stopColor={sourceColour} stopOpacity=".65" />
          <stop offset="1" stopColor={sourceColour} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lens-halo">
          <stop offset="0" stopColor="#83e7f7" stopOpacity=".24" />
          <stop offset="1" stopColor="#83e7f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="lensing-axis" d="M155 345 L748 165" />
      <path className="lensing-track" d="M260 92 L645 485" />
      <path className="ray ray-a" d={`M748 165 L${lensX - 18} ${lensY - 20} L155 345`} />
      <path className="ray ray-b" d={`M748 165 L${lensX + 18} ${lensY + 20} L155 345`} />
      <circle cx="748" cy="165" r={58 + Math.min(40, Math.log1p(currentAmplification) * 12)} fill="url(#source-halo)" />
      <circle cx="748" cy="165" r="7" fill={sourceColour} />
      <circle cx="155" cy="345" r="6" className="observer" />
      <circle cx={lensX} cy={lensY} r="38" fill="url(#lens-halo)" />
      <circle cx={lensX} cy={lensY} r="14" className="lens-body" />
      <circle cx={lensX} cy={lensY} r="23" className="lens-ring" />
      <text x="118" y="376">OBSERVER</text>
      <text x="714" y="137">SOURCE</text>
      <text x={lensX - 36} y={lensY + 48}>LENS</text>

      <g className="image-plane">
        <rect x="28" y="46" width="252" height="150" rx="3" />
        <text x="48" y="70">IMAGE PLANE</text>
        <circle cx="154" cy="124" r="45" className="einstein-ring" />
        <path d={`M 154 79 A 45 45 0 0 1 ${154 + 45 * Math.sin(arcSpan * Math.PI / 360)} ${124 - 45 * Math.cos(arcSpan * Math.PI / 360)}`} style={{ stroke: sourceColour, opacity: ringOpacity }} />
        <path d={`M 154 169 A 45 45 0 0 1 ${154 - 45 * Math.sin(arcSpan * Math.PI / 360)} ${124 + 45 * Math.cos(arcSpan * Math.PI / 360)}`} style={{ stroke: sourceColour, opacity: ringOpacity }} />
      </g>

      <g className="source-plane">
        <rect x="620" y="354" width="252" height="150" rx="3" />
        <text x="640" y="378">SOURCE PLANE</text>
        <line x1="642" y1="435" x2="850" y2="435" />
        <circle cx="746" cy="435" r="4" className="caustic" />
        <circle cx={746 + tau * 27} cy={435 - Math.max(-1.5, Math.min(1.5, event.u0)) * 20} r="6" style={{ fill: sourceColour }} />
      </g>
      <text className="diagram-amplification" x="450" y="72" textAnchor="middle">A = {format(currentAmplification, 2)}×</text>
      <text className="diagram-equation" x="450" y="92" textAnchor="middle">u(t) = {format(u, 3)} θE · u₀ = {format(event.u0, 3)} θE</text>
    </svg>
  )
}
