import React, { lazy, Suspense, useEffect, useState } from 'react'
import StarField from './components/StarField'
import Counter from './components/Counter'
import Reveal from './components/Reveal'
import ScienceDiagram from './components/ScienceDiagram'
import VideoPlayer from './components/VideoPlayer'

const MapExplorer = lazy(() => import('./components/MapExplorer'))

const GITHUB_URL = 'https://github.com/BYniNsKI-kOksU/aurora-website'
const DOCS_URL = '/README.md'

const pipeline = [
  ['01', 'Gaia DR3', 'Astrometric and photometric source catalogue'],
  ['02', 'Catalogue processing', 'Validated, filtered and tiled source data'],
  ['03', 'Physical properties', 'Flux, magnitude and stellar distance'],
  ['04', 'Temperature model', 'Blackbody-inspired chromatic response'],
  ['05', 'Hammer projection', 'Equal-area galactic coordinate mapping'],
  ['06', 'High-res rendering', 'Point spread function and tone mapping'],
  ['07', 'Relativistic lensing', 'Paczynski transient light curves'],
  ['08', '16K / 32K output', 'Publication and cinema-scale masters'],
]

const science = [
  ['gaia', 'Gaia DR3', 'A precise three-dimensional survey of the Milky Way provides the astrometry and photometry behind every rendered source.'],
  ['hammer', 'Hammer projection', 'An equal-area mapping turns the celestial sphere into a continuous all-sky view without favouring one region by area.'],
  ['blackbody', 'Blackbody colour', 'Effective temperature is translated into a physically motivated chromatic approximation rather than an arbitrary colour scale.'],
  ['temperature', 'Effective temperature', 'Gaia stellar parameters drive the spectral balance, from cooler amber stars to hot blue-white sources.'],
  ['galactic', 'Galactic coordinates', 'Longitude and latitude align the map to the plane and centre of the Milky Way for scientific readability.'],
  ['lensing', 'Microlensing', 'A Paczynski light curve models the transient amplification caused when a compact lens crosses the line of sight.'],
]

const technologies = [
  ['Py', 'Python', 'Pipeline orchestration and reproducible analysis'],
  ['∑', 'NumPy', 'Vectorised catalogue and image operations'],
  ['A', 'Astropy', 'Coordinates, units and astronomical models'],
  ['ƒ', 'SciPy', 'Signal processing and numerical transforms'],
  ['π', 'Matplotlib', 'High-resolution scientific rendering'],
  ['▶', 'FFmpeg', '10-bit encoding and animation masters'],
  ['G', 'Gaia Archive', 'ESA DR3 catalogue and source parameters'],
]

const milestones = [
  ['2024', 'Catalogue foundation', 'Gaia DR3 ingestion, coordinate transforms and first full-sky tests.', 'complete'],
  ['2025', 'Physical rendering', 'Temperature-aware colour, PSF modelling and 16K output pipeline.', 'complete'],
  ['2026', 'Relativistic transients', 'Microlensing simulation and publication-ready animation workflow.', 'active'],
  ['Next', 'Interactive atlas', 'Real source lookup, browser-scale tiling and scientific annotations.', 'future'],
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <Header scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main id="main">
        <Hero />
        <Introduction />
        <Pipeline />
        <Results />
        <Science />
        <Technology />
        <InteractiveSky />
        <Timeline />
        <Downloads />
        <Github />
      </main>
      <Footer />
    </div>
  )
}

function Header({ scrolled, menuOpen, setMenuOpen }) {
  const closeMenu = () => setMenuOpen(false)
  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="wordmark" href="#top" aria-label="AURORA home"><span className="aurora-mark" aria-hidden="true"><i /><i /></span>AURORA</a>
      <nav className={menuOpen ? 'is-open' : ''} aria-label="Main navigation">
        <a href="#project" onClick={closeMenu}>Project</a>
        <a href="#pipeline" onClick={closeMenu}>Pipeline</a>
        <a href="#results" onClick={closeMenu}>Results</a>
        <a href="#science" onClick={closeMenu}>Science</a>
        <a href="#downloads" onClick={closeMenu}>Downloads</a>
      </nav>
      <a className="header-cta" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub <span>↗</span></a>
      <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <StarField />
      <div className="hero-nebula" aria-hidden="true" />
      <div className="hero-orbit orbit-a" aria-hidden="true" />
      <div className="hero-orbit orbit-b" aria-hidden="true" />
      <div className="hero-content">
        <p className="eyebrow"><span /> Gaia DR3 · Relativistic astrophysics</p>
        <h1 id="hero-title">AURORA</h1>
        <p className="expansion">Astronomical Unified Rendering<br />Of Relativistic Astrophysics</p>
        <p className="hero-copy">A high-resolution astronomical renderer based on Gaia DR3, capable of producing physically motivated all-sky maps and relativistic transient simulations.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#project">Explore project <span>↓</span></a>
          <a className="button button-outline" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub <span>↗</span></a>
          <a className="button button-quiet" href={DOCS_URL}>Documentation</a>
          <a className="button button-quiet" href="#downloads">Downloads</a>
        </div>
      </div>
      <div className="hero-index"><span>ALL-SKY / 32K</span><span>GALACTIC COORDINATES</span></div>
      <a className="scroll-indicator" href="#project"><i /><span>Scroll to observe</span></a>
    </section>
  )
}

function Introduction() {
  return (
    <section className="section intro" id="project" aria-labelledby="intro-title">
      <Reveal>
        <p className="section-label">01 / Mission</p>
        <div className="intro-grid">
          <h2 id="intro-title">Rendering the galaxy<br />from <em>measurement.</em></h2>
          <div className="intro-copy">
            <p>AURORA transforms the precision of the Gaia catalogue into an explorable visual record of our galaxy. It was built to bridge scientific computation and cinematic resolution without sacrificing physical meaning.</p>
            <p>Unlike decorative star maps, every luminous source begins with measured data. Temperature, flux and position flow through a reproducible pipeline designed for both still imagery and relativistic events.</p>
          </div>
        </div>
      </Reveal>
      <div className="stat-row">
        <Counter value={150} suffix="M+" label="Gaia DR3 stars" />
        <Counter value={32} suffix="K" label="Maximum render" />
        <Counter value={16} suffix="K" label="Animation master" />
        <div className="counter static-counter"><strong>Open</strong><span>Source architecture</span></div>
      </div>
    </section>
  )
}

function Pipeline() {
  return (
    <section className="section pipeline" id="pipeline" aria-labelledby="pipeline-title">
      <Reveal className="section-heading centred">
        <p className="section-label">02 / Scientific pipeline</p>
        <h2 id="pipeline-title">From catalogue row<br />to <em>celestial field.</em></h2>
        <p>Eight deliberate stages preserve the science while scaling the output from source data to publication-grade imagery.</p>
      </Reveal>
      <ol className="pipeline-list">
        {pipeline.map(([number, title, copy], index) => (
          <Reveal as="li" key={number} delay={index * 55}>
            <span className="pipeline-number">{number}</span>
            <div><h3>{title}</h3><p>{copy}</p></div>
            <span className="pipeline-state">{index < 7 ? 'Processed' : 'Master'}</span>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

function Results() {
  const cards = [
    { kind: 'image', label: '32K master map', title: 'The Milky Way, resolved', detail: '32,768 × 16,384', src: '/assets/aurora-sky-preview.jpg' },
    { kind: 'image', label: '16K all-sky map', title: 'Catalogue-scale structure', detail: '16,384 × 8,192', src: '/assets/aurora-sky-preview.jpg' },
    { kind: 'video', label: 'Relativistic simulation', title: 'Microlensing in motion', detail: '16K animation', src: '/assets/aurora-microlensing-preview.mp4', poster: '/assets/microlensing-poster.jpg' },
    { kind: 'image', label: 'Web preview', title: 'A navigable galactic field', detail: '2,400 × 1,200', src: '/assets/microlensing-poster.jpg' },
  ]

  return (
    <section className="results-shell" id="results" aria-labelledby="results-title">
      <div className="section">
        <Reveal className="section-heading split-heading">
          <div><p className="section-label">03 / Results</p><h2 id="results-title">Observe the<br /><em>rendered universe.</em></h2></div>
          <p>Lightweight previews reveal the character of AURORA’s master outputs. Open any still to zoom and inspect it at full screen.</p>
        </Reveal>
        <div className="results-grid">
          {cards.map((card, index) => (
            <Reveal key={card.title} className={index === 0 ? 'result-large' : ''} delay={index * 70}>
              {card.kind === 'video' ? <VideoPlayer src={card.src} poster={card.poster} /> : <ResultImage card={card} />}
              <div className="result-footer"><div><span>{card.label}</span><h3>{card.title}</h3></div><small>{card.detail}</small></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ResultImage({ card }) {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => { setOpen(false); setZoom(1); setPosition({ x: 0, y: 0 }) }
  const onWheel = (event) => {
    event.preventDefault()
    setZoom((value) => Math.max(1, Math.min(5, value + (event.deltaY < 0 ? .25 : -.25))))
  }
  const onMove = (event) => {
    if (!drag) return
    setPosition({ x: drag.x + event.clientX - drag.clientX, y: drag.y + event.clientY - drag.clientY })
  }

  return (
    <>
      <div className="result-media">
        <img src={card.src} alt={`${card.title} — AURORA astronomical render`} loading="lazy" />
        <div className="result-overlay">
          <button type="button" onClick={() => setOpen(true)}>Preview</button>
          <a href={card.src} download>Download</a>
          <button type="button" onClick={() => setOpen(true)}>Fullscreen</button>
        </div>
      </div>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${card.title} image viewer`}>
          <div className="viewer-toolbar"><span>{card.title}</span><div><button type="button" onClick={() => setZoom(Math.max(1, zoom - .25))} aria-label="Zoom out">−</button><output>{Math.round(zoom * 100)}%</output><button type="button" onClick={() => setZoom(Math.min(5, zoom + .25))} aria-label="Zoom in">+</button><button type="button" onClick={close}>Close</button></div></div>
          <div className="viewer-canvas" onWheel={onWheel} onPointerMove={onMove} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
            <img src={card.src} alt="" draggable="false" onPointerDown={(event) => { setDrag({ clientX: event.clientX, clientY: event.clientY, ...position }); event.currentTarget.setPointerCapture(event.pointerId) }} style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` }} />
          </div>
          <p className="viewer-hint">Scroll or pinch to zoom · drag to pan · Esc to close</p>
        </div>
      )}
    </>
  )
}

function Science() {
  return (
    <section className="section science" id="science" aria-labelledby="science-title">
      <Reveal className="section-heading split-heading">
        <div><p className="section-label">04 / Science</p><h2 id="science-title">The physics behind<br />the <em>light.</em></h2></div>
        <p>A compact scientific model gives each rendered source a place, intensity and colour—then lets gravity temporarily change what an observer sees.</p>
      </Reveal>
      <div className="science-grid">
        {science.map(([type, title, copy], index) => (
          <Reveal as="article" className="science-card" key={title} delay={(index % 3) * 70}>
            <span className="science-index">0{index + 1}</span>
            <ScienceDiagram type={type} />
            <h3>{title}</h3>
            <p>{copy}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Technology() {
  return (
    <section className="section technology" aria-labelledby="technology-title">
      <Reveal><p className="section-label">05 / Technical foundation</p><h2 id="technology-title">Built with the language<br />of <em>scientific computing.</em></h2></Reveal>
      <div className="tech-grid">
        {technologies.map(([icon, title, copy], index) => <Reveal as="article" className="tech-card" key={title} delay={(index % 4) * 45}><span>{icon}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}
      </div>
    </section>
  )
}

function InteractiveSky() {
  return (
    <section className="interactive-shell" aria-labelledby="interactive-title">
      <div className="section">
        <Reveal className="section-heading split-heading">
          <div><p className="section-label">06 / Interactive sky</p><h2 id="interactive-title">Select a point<br />in the <em>galaxy.</em></h2></div>
          <p>Explore the preview field and inspect a representative Gaia source. The component is ready to accept tiled imagery and live catalogue records.</p>
        </Reveal>
        <Suspense fallback={<div className="map-loading" role="status">Calibrating sky coordinates…</div>}><MapExplorer /></Suspense>
      </div>
    </section>
  )
}

function Timeline() {
  return (
    <section className="section timeline" aria-labelledby="timeline-title">
      <Reveal><p className="section-label">07 / Project timeline</p><h2 id="timeline-title">A long exposure,<br /><em>still developing.</em></h2></Reveal>
      <ol>
        {milestones.map(([year, title, copy, state], index) => <Reveal as="li" key={title} className={state} delay={index * 70}><span>{year}</span><i /><h3>{title}</h3><p>{copy}</p></Reveal>)}
      </ol>
    </section>
  )
}

function Downloads() {
  const items = [
    ['01', 'Source code', 'Inspect the renderer, simulation pipeline and reproducible project structure.', GITHUB_URL, 'Open GitHub'],
    ['02', 'Documentation', 'Read the architecture, requirements and workflow behind the AURORA renders.', DOCS_URL, 'Read documentation'],
    ['03', 'Latest release', 'Access the newest tagged build and browser-ready output previews.', GITHUB_URL, 'View releases'],
    ['04', 'Scientific paper', 'Methods, validation and interpretation prepared for a future publication.', '#', 'In preparation'],
  ]
  return (
    <section className="section downloads" id="downloads" aria-labelledby="downloads-title">
      <Reveal className="section-heading split-heading"><div><p className="section-label">08 / Resources</p><h2 id="downloads-title">Take AURORA<br /><em>with you.</em></h2></div><p>Project materials are organized for researchers, developers and visual storytellers.</p></Reveal>
      <div className="download-grid">
        {items.map(([number, title, copy, href, action], index) => <Reveal as="a" href={href} className={`download-card ${href === '#' ? 'is-disabled' : ''}`} key={title} delay={index * 60} aria-disabled={href === '#'} onClick={href === '#' ? (event) => event.preventDefault() : undefined}><span>{number}</span><h3>{title}</h3><p>{copy}</p><strong>{action} <i>↗</i></strong></Reveal>)}
      </div>
    </section>
  )
}

function Github() {
  return (
    <section className="section github-section" aria-labelledby="github-title">
      <Reveal className="github-panel">
        <div className="github-copy"><p className="section-label">09 / Open research</p><h2 id="github-title">Observe the code.<br /><em>Advance the work.</em></h2><p>AURORA’s public architecture is designed for inspection, extension and future scientific collaboration.</p><a className="button button-primary" href={GITHUB_URL} target="_blank" rel="noreferrer">Explore repository <span>↗</span></a></div>
        <dl>
          <div><dt>Stars</dt><dd>—</dd></div><div><dt>Forks</dt><dd>—</dd></div><div><dt>Commits</dt><dd>—</dd></div><div><dt>Latest release</dt><dd>Research preview</dd></div>
        </dl>
        <p className="api-note"><span /> GitHub API-ready data layer</p>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-brand"><a className="wordmark" href="#top"><span className="aurora-mark" aria-hidden="true"><i /><i /></span>AURORA</a><p>Astronomical Unified Rendering<br />Of Relativistic Astrophysics</p></div>
      <p>Created by Patryk Kropacz<br />Based on publicly available ESA Gaia DR3 data.</p>
      <nav aria-label="Footer navigation"><a href={GITHUB_URL}>GitHub</a><a href={DOCS_URL}>Documentation</a><a href={GITHUB_URL}>License</a></nav>
      <a className="back-to-top" href="#top">Return to orbit ↑</a>
    </footer>
  )
}
