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

const FINITE_SOURCE_DISPLAY_RADIUS = .05

const superscriptInteger = (value) => String(value)
  .replace('-', '⁻')
  .replace(/[0-9]/g, (digit) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)])

const formatSeparation = (value) => {
  if (value == null) return '—'
  const magnitude = Math.abs(value)
  if (magnitude === 0) return '0'
  if (magnitude < .001) {
    const exponent = Math.floor(Math.log10(magnitude))
    return `${(value / 10 ** exponent).toFixed(2)} × 10${superscriptInteger(exponent)}`
  }
  return format(value, 3)
}

const formatAmplification = (value) => {
  if (value < 10000) return `${format(value, 2)}×`
  const exponent = Math.floor(Math.log10(value))
  return `${(value / 10 ** exponent).toFixed(2)} × 10${superscriptInteger(exponent)}`
}

function pointLensState(u0, tau) {
  const impact = Number.isFinite(u0) ? u0 : 0
  const phase = Number.isFinite(tau) ? tau : 0
  const uSquared = impact * impact + phase * phase
  const u = Math.sqrt(uSquared)
  const root = Math.sqrt(uSquared + 4)
  const thetaPlus = .5 * (u + root)
  const thetaMinusRaw = .5 * (u - root)
  const thetaMinus = thetaMinusRaw === 0 && u > 0 ? -2 / (u + root) : thetaMinusRaw
  const safeU = Math.max(u, 1e-12)
  const total = (uSquared + 2) / (safeU * root)
  const muPlus = .5 * (1 + total)
  const muMinus = Math.max(0, .5 * (total - 1))
  const lensOffset = { x: phase, y: impact }
  const sourceOffset = { x: -phase, y: -impact }
  const direction = u > 0
    ? { x: sourceOffset.x / u, y: sourceOffset.y / u }
    : { x: -1, y: 0 }

  return {
    u,
    uSquared,
    thetaPlus,
    thetaMinus,
    muPlus,
    muMinus,
    amplification: muPlus + muMinus,
    direction,
    lensOffset,
    sourceOffset,
    aligned: uSquared === 0,
  }
}

function finiteSourceImageContours(sourceOffset, radius = FINITE_SOURCE_DISPLAY_RADIUS, samples = 80) {
  const plus = []
  const minus = []

  for (let index = 0; index < samples; index += 1) {
    const angle = 2 * Math.PI * (index + .5) / samples
    const betaX = sourceOffset.x + radius * Math.cos(angle)
    const betaY = sourceOffset.y + radius * Math.sin(angle)
    const beta = Math.hypot(betaX, betaY)
    const unit = beta > 1e-10
      ? { x: betaX / beta, y: betaY / beta }
      : { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) }
    const root = Math.sqrt(beta * beta + 4)
    const thetaPlus = .5 * (beta + root)
    const thetaMinus = -2 / (beta + root)

    plus.push({ x: unit.x * thetaPlus, y: unit.y * thetaPlus })
    minus.push({ x: unit.x * thetaMinus, y: unit.y * thetaMinus })
  }

  return {
    plus,
    minus,
    containsCaustic: Math.hypot(sourceOffset.x, sourceOffset.y) < radius,
  }
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
  const currentAmplification = pointLensState(event.u0, tau).amplification

  return (
    <div className="event-dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" onMouseDown={(mouseEvent) => {
      if (mouseEvent.target === mouseEvent.currentTarget) onClose()
    }}>
      <article className="event-sheet">
        <button className="event-close" type="button" onClick={onClose} aria-label="Close event details">×</button>
        <section className="event-visual">
          <div className="event-visual-head">
            <div>
              <span>Third-person lensing geometry</span>
              <small>Thin-lens approximation · distances are not shown to scale</small>
            </div>
            <strong>PSPL / PACZYŃSKI</strong>
          </div>
          <LensingDiagram event={event} tau={tau} />
          <div className="event-timeline">
            <div><label htmlFor="event-time">Time from peak</label><output>{tau >= 0 ? '+' : ''}{format(tau, 2)} tE · A = {formatAmplification(currentAmplification)}</output></div>
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
            <div><span>Impact u₀</span><strong>{formatSeparation(event.u0)}</strong></div>
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

          <p className="event-science-note">The geometry is normalised to the Einstein radius. Source and observer remain fixed while the lens moves in one direction at constant speed; τ = 0 is closest approach, not a turning point. Rays change direction only in the thin-lens plane. The image plane preserves the exact PSPL positions θ+ and θ− and also maps an illustrative extended source with ρvis = 0.05 θE. This visual layer produces physical arcs and a near-ring without changing the catalogue PSPL light curve; the mathematically thin Einstein ring remains exclusive to u = 0.</p>
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
  const width = 900
  const height = 560
  const sourceColour = event.sourceColor?.css || '#d9f0ff'
  const lensState = pointLensState(event.u0, tau)
  const {
    u,
    thetaPlus,
    thetaMinus,
    muPlus,
    muMinus,
    amplification: currentAmplification,
    direction,
    lensOffset,
    sourceOffset,
    aligned,
  } = lensState

  const axisY = height * .63
  const observer = { x: width * .11, y: axisY }
  const source = { x: width * .89, y: axisY }
  const lensOrigin = { x: width * .5, y: axisY }
  const trackDir = { x: .34, y: Math.sqrt(1 - .34 * .34) }
  const impactDir = { x: -Math.sqrt(1 - .34 * .34), y: .34 }
  const trajectoryExtent = Math.max(1, Math.hypot(3.25, lensOffset.y))
  const trajectoryScale = Math.min(36, Math.min(width * .17, height * .16) / trajectoryExtent)
  const closest = {
    x: lensOrigin.x + impactDir.x * lensOffset.y * trajectoryScale,
    y: lensOrigin.y + impactDir.y * lensOffset.y * trajectoryScale,
  }
  const lens = {
    x: closest.x + trackDir.x * lensOffset.x * trajectoryScale,
    y: closest.y + trackDir.y * lensOffset.x * trajectoryScale,
  }
  const trackStart = {
    x: closest.x - trackDir.x * 3.25 * trajectoryScale,
    y: closest.y - trackDir.y * 3.25 * trajectoryScale,
  }
  const trackEnd = {
    x: closest.x + trackDir.x * 3.25 * trajectoryScale,
    y: closest.y + trackDir.y * 3.25 * trajectoryScale,
  }
  const projectedSource = {
    x: trackDir.x * sourceOffset.x + impactDir.x * sourceOffset.y,
    y: trackDir.y * sourceOffset.x + impactDir.y * sourceOffset.y,
  }
  const imageAxis = u > 0
    ? { x: projectedSource.x / u, y: projectedSource.y / u }
    : { x: -trackDir.x, y: -trackDir.y }
  const bendScale = trajectoryScale * .82
  const bendPlus = {
    x: lens.x + imageAxis.x * thetaPlus * bendScale,
    y: lens.y + imageAxis.y * thetaPlus * bendScale,
  }
  const bendMinus = {
    x: lens.x + imageAxis.x * thetaMinus * bendScale,
    y: lens.y + imageAxis.y * thetaMinus * bendScale,
  }
  const planeHalf = Math.max(Math.abs(thetaPlus), Math.abs(thetaMinus)) * bendScale + 12
  const planeStart = {
    x: lens.x - imageAxis.x * planeHalf,
    y: lens.y - imageAxis.y * planeHalf,
  }
  const planeEnd = {
    x: lens.x + imageAxis.x * planeHalf,
    y: lens.y + imageAxis.y * planeHalf,
  }

  const totalMu = Math.max(1e-12, muPlus + muMinus)
  const sharePlus = muPlus / totalMu
  const shareMinus = muMinus / totalMu
  const rayPlusWidth = 1.1 + 3.2 * Math.sqrt(sharePlus)
  const rayMinusWidth = 1.1 + 3.2 * Math.sqrt(shareMinus)
  const rayPlusOpacity = .28 + .7 * Math.sqrt(sharePlus)
  const rayMinusOpacity = .28 + .7 * Math.sqrt(shareMinus)

  const panelWidth = 238
  const panelHeight = 130
  const panelTop = 73
  const imageInset = { x: 18, y: panelTop, width: panelWidth, height: panelHeight }
  const sourceInset = { x: width - panelWidth - 18, y: panelTop, width: panelWidth, height: panelHeight }
  const imageCentre = {
    x: imageInset.x + imageInset.width * .5,
    y: imageInset.y + imageInset.height * .68,
  }
  const imageExtent = Math.max(1.12, Math.abs(thetaPlus), Math.abs(thetaMinus))
  const imageScale = Math.min(29, imageInset.width * .29 / imageExtent, imageInset.height * .29 / imageExtent)
  const einsteinRadius = imageScale
  const imagePlus = {
    x: imageCentre.x + direction.x * thetaPlus * imageScale,
    y: imageCentre.y + direction.y * thetaPlus * imageScale,
  }
  const imageMinus = {
    x: imageCentre.x + direction.x * thetaMinus * imageScale,
    y: imageCentre.y + direction.y * thetaMinus * imageScale,
  }
  const imageAngle = Math.atan2(direction.y, direction.x) * 180 / Math.PI + 90
  const finiteContours = finiteSourceImageContours(sourceOffset)
  const contourPath = (points) => `${points.map((point, index) => {
    const x = imageCentre.x + point.x * imageScale
    const y = imageCentre.y + point.y * imageScale
    return `${index ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')} Z`
  const plusContour = contourPath(finiteContours.plus)
  const minusContour = contourPath(finiteContours.minus)
  const pointRatio = u / FINITE_SOURCE_DISPLAY_RADIUS
  const pointVisibility = pointRatio * pointRatio / (.08 + pointRatio * pointRatio)

  const pointImage = (point, colour, mu, share, label, labelOffset) => {
    const strength = Math.min(1, Math.log1p(mu) / Math.log(32))
    const core = 2.3 + 1.9 * strength
    const major = core * (1.35 + 1.15 * strength)
    const minor = Math.max(1.7, core * .58)

    return (
      <g key={label} data-image={label} opacity={(.45 + .53 * Math.sqrt(share)) * pointVisibility}>
        <ellipse cx={point.x} cy={point.y} rx={major + 3} ry={minor + 2} fill={colour} opacity=".22" transform={`rotate(${imageAngle} ${point.x} ${point.y})`} filter="url(#image-psf)" />
        <ellipse cx={point.x} cy={point.y} rx={major} ry={minor} fill={colour} opacity=".42" transform={`rotate(${imageAngle} ${point.x} ${point.y})`} />
        <circle cx={point.x} cy={point.y} r={core} fill={sourceColour} stroke={colour} strokeWidth="1.2" />
        <text x={point.x + 7} y={point.y + labelOffset} style={{ fill: colour }}>{label}</text>
      </g>
    )
  }

  const sourceCentre = {
    x: sourceInset.x + sourceInset.width * .5,
    y: sourceInset.y + sourceInset.height * .68,
  }
  const sourceExtent = Math.max(3.15, event.u0 + .4)
  const sourceScale = Math.min(15.5, sourceInset.width * .31 / 3.15, sourceInset.height * .29 / sourceExtent)
  const sourceTrackY = sourceCentre.y + sourceOffset.y * sourceScale
  const sourceMarker = {
    x: sourceCentre.x + sourceOffset.x * sourceScale,
    y: sourceTrackY,
  }
  const sourceTrackStart = sourceCentre.x - 3 * sourceScale
  const sourceTrackEnd = sourceCentre.x + 3 * sourceScale
  const impactBracketX = sourceCentre.x + 3.18 * sourceScale
  const brightening = Math.min(1, Math.log1p(Math.max(0, currentAmplification - 1)) / Math.log(30))
  const sourceCoreRadius = 5.5 + 1.8 * brightening
  const sourceHaloRadius = 14 + 10 * brightening
  const atPeak = tau === 0
  const theme = event.massIsEstimated
    ? { halo: '#ffb45e', rim: '#ffb45e', accent: '#f2eee4', text: 'LENS · MODEL' }
    : { halo: '#65d8ff', rim: '#88deff', accent: '#d7f5ff', text: 'LENS · CATALOGUE MASS' }
  const imageStatus = aligned
    ? 'u = 0 · EINSTEIN RING'
    : finiteContours.containsCaustic
      ? `u = ${formatSeparation(u)} · NEAR-RING`
      : `u = ${formatSeparation(u)} · TWO EXTENDED IMAGES`
  const planeError = (point) => Math.abs(
    (point.x - lens.x) * imageAxis.y - (point.y - lens.y) * imageAxis.x,
  )

  return (
    <svg
      className="lensing-diagram"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Microlensing geometry for ${event.name}`}
      data-u={u}
      data-u0={event.u0}
      data-tau={tau}
      data-aligned={aligned}
      data-theta-plus={thetaPlus}
      data-theta-minus={thetaMinus}
      data-mu-plus={muPlus}
      data-mu-minus={muMinus}
      data-amplification={currentAmplification}
      data-lens-x={lens.x}
      data-lens-y={lens.y}
      data-closest-x={closest.x}
      data-closest-y={closest.y}
      data-bend-plus-plane-error={planeError(bendPlus)}
      data-bend-minus-plane-error={planeError(bendMinus)}
    >
      <title>Microlensing geometry for {event.name}</title>
      <desc>PSPL model with rectilinear lens motion, a fixed observer and source, and two-segment rays bending only in the thin-lens plane.</desc>
      <defs>
        <radialGradient id="source-halo">
          <stop offset="0" stopColor={sourceColour} stopOpacity={.34 + .24 * brightening} />
          <stop offset="1" stopColor={sourceColour} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lens-halo">
          <stop offset="0" stopColor={theme.halo} stopOpacity=".48" />
          <stop offset="1" stopColor={theme.halo} stopOpacity="0" />
        </radialGradient>
        <filter id="image-psf" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <filter id="extended-image-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <marker id="motion-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={theme.rim} opacity=".75" />
        </marker>
      </defs>

      <path className="lensing-axis" d={`M ${observer.x} ${observer.y} H ${source.x}`} />
      <text x={observer.x} y={axisY - 12}>OPTICAL AXIS</text>
      <path className="lensing-track" d={`M ${trackStart.x} ${trackStart.y} L ${trackEnd.x} ${trackEnd.y}`} markerEnd="url(#motion-arrow)" style={{ stroke: theme.rim }} />
      <text x={trackStart.x - 4} y={trackStart.y - 9} style={{ fill: theme.rim }}>CONSTANT DIRECTION</text>

      {atPeak ? (
        <path d={`M ${lensOrigin.x} ${lensOrigin.y} L ${closest.x} ${closest.y}`} fill="none" stroke="#f6d48c" strokeWidth="1.1" opacity=".72" />
      ) : (
        <>
          <path d={`M ${lensOrigin.x} ${lensOrigin.y} L ${closest.x} ${closest.y}`} fill="none" stroke="#aeb5bc" strokeWidth="1" strokeDasharray="3 4" />
          <path d={`M ${lensOrigin.x} ${lensOrigin.y} L ${lens.x} ${lens.y}`} fill="none" stroke="#f6d48c" strokeWidth="1.1" opacity=".72" />
          <text x={(lensOrigin.x + closest.x) / 2 - 7} y={(lensOrigin.y + closest.y) / 2 - 6}>u₀</text>
          <text x={(lensOrigin.x + lens.x) / 2 + 6} y={(lensOrigin.y + lens.y) / 2 - 6} style={{ fill: '#f6d48c' }}>u(t)</text>
        </>
      )}

      <g data-alignment-origin="true">
        <circle cx={lensOrigin.x} cy={lensOrigin.y} r="5.2" fill="#0a0d11" stroke="#e8eef4" strokeWidth="1.1" />
        <path d={`M ${lensOrigin.x - 8} ${lensOrigin.y} H ${lensOrigin.x + 8} M ${lensOrigin.x} ${lensOrigin.y - 8} V ${lensOrigin.y + 8}`} stroke="#e8eef4" strokeWidth=".8" opacity=".7" />
        <text x={lensOrigin.x + 10} y={lensOrigin.y - 10} style={{ fill: '#c8d0d7' }}>ONLY β = 0 POINT</text>
      </g>
      <circle cx={closest.x} cy={closest.y} r="4.2" fill="#0a0d11" stroke={theme.rim} strokeWidth="1.3" />
      <text x={closest.x - 68} y={closest.y + 56} textAnchor="middle">CLOSEST APPROACH · τ = 0</text>
      <text x={closest.x - 68} y={closest.y + 69} textAnchor="middle" style={{ fill: '#f6d48c' }}>
        {atPeak ? `u(t) = u₀ = ${formatSeparation(u)}` : `u₀ = ${formatSeparation(event.u0)}`}
      </text>

      <path className="lens-plane-line" d={`M ${planeStart.x} ${planeStart.y} L ${planeEnd.x} ${planeEnd.y}`} />
      <text x={planeStart.x - 6} y={planeStart.y - 6} textAnchor="end">THIN-LENS PLANE</text>
      <path data-ray="plus" className="ray ray-a" d={`M ${source.x} ${source.y} L ${bendPlus.x} ${bendPlus.y} L ${observer.x} ${observer.y}`} strokeWidth={rayPlusWidth} opacity={rayPlusOpacity} />
      <path data-ray="minus" className="ray ray-b" d={`M ${source.x} ${source.y} L ${bendMinus.x} ${bendMinus.y} L ${observer.x} ${observer.y}`} strokeWidth={rayMinusWidth} opacity={rayMinusOpacity} />
      <circle cx={bendPlus.x} cy={bendPlus.y} r="4.2" fill="#65d8ff" stroke="#071016" strokeWidth="1.5" />
      <circle cx={bendMinus.x} cy={bendMinus.y} r="4.2" fill="#ffb45e" stroke="#160f08" strokeWidth="1.5" />
      <text x={bendPlus.x + 8} y={bendPlus.y - 7} style={{ fill: '#65d8ff' }}>θ+</text>
      <text x={bendMinus.x + 8} y={bendMinus.y + 13} style={{ fill: '#ffb45e' }}>θ−</text>

      <circle cx={observer.x} cy={observer.y} r="8" fill="#e8eef4" opacity=".12" />
      <circle cx={observer.x} cy={observer.y} r="4.8" className="observer" />
      <circle cx={lens.x} cy={lens.y} r="20" fill="url(#lens-halo)" />
      <circle cx={lens.x} cy={lens.y} r="10" fill="#050608" stroke={theme.rim} strokeWidth="2" />
      {atPeak && <circle cx={lens.x} cy={lens.y} r="15" fill="none" stroke={theme.rim} strokeWidth="1.2" strokeDasharray="3 4" opacity=".72" />}
      <circle cx={source.x} cy={source.y} r={sourceHaloRadius} fill="url(#source-halo)" />
      <circle cx={source.x} cy={source.y} r={sourceCoreRadius} fill={sourceColour} />
      <text x={observer.x - 28} y={observer.y + 25}>FIXED OBSERVER</text>
      <text x={source.x - 36} y={source.y - 16}>FIXED SOURCE</text>
      <text x={source.x - 80} y={source.y + 24} style={{ fill: sourceColour }}>A(t) = {formatAmplification(currentAmplification)}</text>
      <text x={lens.x + 14} y={lens.y + 23}>{theme.text}</text>
      <text x={lens.x + 14} y={lens.y + 37} style={{ fill: theme.accent }}>{formatMass(event)}</text>

      <g className="image-plane">
        <rect x={imageInset.x} y={imageInset.y} width={imageInset.width} height={imageInset.height} rx="12" />
        <path className="plane-grid" d={`M ${imageInset.x + 14} ${imageCentre.y} H ${imageInset.x + imageInset.width - 14} M ${imageCentre.x} ${imageInset.y + 45} V ${imageInset.y + imageInset.height - 10}`} />
        <circle cx={imageCentre.x} cy={imageCentre.y} r={einsteinRadius} className="einstein-ring" />
        <circle cx={imageCentre.x} cy={imageCentre.y} r="3.2" fill="#050608" stroke={theme.rim} strokeWidth="1" />
        <g className="extended-image" data-extended-image={finiteContours.containsCaustic ? 'annulus' : 'arcs'}>
          <path d={`${plusContour} ${minusContour}`} fill={sourceColour} fillOpacity=".24" fillRule="evenodd" filter="url(#extended-image-glow)" />
          <path d={`${plusContour} ${minusContour}`} fill={sourceColour} fillOpacity=".22" fillRule="evenodd" />
          <path d={plusContour} fill="none" stroke="#65d8ff" strokeWidth="1.7" opacity=".92" />
          <path d={minusContour} fill="none" stroke="#ffb45e" strokeWidth="1.7" opacity=".86" />
        </g>
        {aligned ? (
          <circle data-einstein-ring="true" cx={imageCentre.x} cy={imageCentre.y} r={einsteinRadius} fill="none" stroke={sourceColour} strokeWidth="2.4" opacity=".98" />
        ) : (
          <>
            {pointImage(imagePlus, '#65d8ff', muPlus, sharePlus, 'θ+', -6)}
            {pointImage(imageMinus, '#ffb45e', muMinus, shareMinus, 'θ−', 11)}
          </>
        )}
        <text x={imageCentre.x + einsteinRadius + 4} y={imageCentre.y - 4} style={{ fill: '#65d8ff' }}>θE</text>
        <text x={imageInset.x + 16} y={imageInset.y + 22} style={{ fill: '#f3efe6' }}>IMAGE PLANE</text>
        <text x={imageInset.x + 16} y={imageInset.y + 39}>{imageStatus}</text>
        <text x={imageInset.x + imageInset.width - 12} y={imageInset.y + 22} textAnchor="end" className="rho-label">ρvis = 0.05 θE</text>
      </g>

      <g className="source-plane">
        <rect x={sourceInset.x} y={sourceInset.y} width={sourceInset.width} height={sourceInset.height} rx="12" />
        <path className="plane-grid" d={`M ${sourceInset.x + 14} ${sourceCentre.y} H ${sourceInset.x + sourceInset.width - 14} M ${sourceCentre.x} ${sourceInset.y + 45} V ${sourceInset.y + sourceInset.height - 10}`} />
        <path d={`M ${sourceTrackEnd} ${sourceTrackY} H ${sourceTrackStart}`} fill="none" stroke="rgba(188,231,255,.48)" strokeDasharray="6 5" markerEnd="url(#motion-arrow)" />
        <path d={`M ${sourceCentre.x} ${sourceCentre.y} L ${sourceMarker.x} ${sourceMarker.y}`} fill="none" stroke="#f6d48c" strokeWidth="1.2" />
        <path d={`M ${impactBracketX - 4} ${sourceCentre.y} h 8 M ${impactBracketX} ${sourceCentre.y} V ${sourceTrackY} M ${impactBracketX - 4} ${sourceTrackY} h 8`} fill="none" stroke="#aeb5bc" />
        <circle cx={sourceCentre.x} cy={sourceCentre.y} r="3.8" className="caustic" />
        <circle cx={sourceMarker.x} cy={sourceMarker.y} r="5.4" fill={sourceColour} />
        <text x={sourceMarker.x + 7} y={sourceMarker.y - 6} style={{ fill: sourceColour }}>SOURCE</text>
        <text x={(sourceCentre.x + sourceMarker.x) / 2 - 8} y={(sourceCentre.y + sourceMarker.y) / 2 - 5} textAnchor="end" style={{ fill: '#f6d48c' }}>β = u θE</text>
        <text x={impactBracketX - 7} y={(sourceCentre.y + sourceTrackY) / 2 + 3} textAnchor="end">u₀</text>
        <text x={sourceInset.x + 16} y={sourceInset.y + 22} style={{ fill: '#f3efe6' }}>SOURCE PLANE</text>
        <text x={sourceInset.x + 16} y={sourceInset.y + 39} style={{ fill: '#ff7b9a' }}>POINT CAUSTIC β = 0</text>
      </g>

      <text className="diagram-amplification" x={width * .5} y={panelTop + 43} textAnchor="middle">A = {formatAmplification(currentAmplification)}</text>
      <text className="diagram-equation" x={width * .5} y={panelTop + 59} textAnchor="middle">u = {formatSeparation(u)} · τ = {tau.toFixed(2)}</text>
      <text className="diagram-caption" x={width * .5} y={Math.min(axisY + height * .18, height - 98)} textAnchor="middle">SKY-PLANE PROJECTION · RECTILINEAR LENS MOTION · FIXED SOURCE AND OBSERVER</text>
    </svg>
  )
}
