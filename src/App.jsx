import React, { useEffect, useState } from 'react'
import StarField from './components/StarField'
import Counter from './components/Counter'
import Reveal from './components/Reveal'
import ScienceDiagram from './components/ScienceDiagram'
import VideoPlayer from './components/VideoPlayer'

const GITHUB_URL = 'https://github.com/BYniNsKI-kOksU/project-AURORA'
const DOCS_URL = `${GITHUB_URL}/blob/main/README.md`
const RELEASES_URL = `${GITHUB_URL}/releases/latest`

const pipelineTracks = [
  {
    number: '01',
    type: 'map',
    label: 'Foundation',
    title: 'All-sky map',
    copy: 'A resumable Gaia DR3 download feeds a memory-aware renderer that turns up to 150 million measured sources into a 16-bit Hammer panorama.',
    metrics: ['150M sources', '16,384 × 8,192', '16-bit PNG'],
    route: 'Gaia DR3 → FITS → Hammer PNG',
  },
  {
    number: '02',
    type: 'lensing',
    label: 'Transient sky',
    title: 'Microlensing',
    copy: 'Gaia microlensing events are animated with the point-source, point-lens Paczyński model and composited over the high-resolution sky.',
    metrics: ['625 frames', '25 seconds', '10-bit HEVC'],
    route: 'Event catalogue + map → MP4',
  },
  {
    number: '03',
    type: 'variable',
    label: 'Variable sky',
    title: 'Stellar pulsation',
    copy: 'Five classes of variable stars receive distinct, deterministic light-curve styles across a compressed eighteen-day observing window.',
    metrics: ['5 star classes', '1,500 frames', '60 seconds'],
    route: 'Variable FITS + map → MP4',
  },
  {
    number: '04',
    type: 'motion',
    label: 'Dynamic catalogue',
    title: 'Proper motion',
    copy: 'Stellar positions are propagated linearly from Gaia epoch 2016.0, with optional radial velocity and a full-sky equirectangular view.',
    metrics: ['250K stars', '+100K years', '360° field'],
    route: 'Gaia DR3 → 6D catalogue → MP4',
  },
  {
    number: '05',
    type: 'observer',
    label: 'Spatial viewpoint',
    title: 'Observer perspective',
    copy: 'A heliocentric 3D catalogue renders the sky from a static point or along a smooth journey from the Solar position into the Galactic halo.',
    metrics: ['500K stars', '20 kpc volume', '4K panorama'],
    route: 'Gaia DR3 → 3D catalogue → MP4',
  },
]

const science = [
  ['gaia', 'Gaia DR3 astrometry', 'Measured positions, parallax, proper motion and photometry form the common physical source for every AURORA pipeline.'],
  ['hammer', 'Equal-area sky mapping', 'The Hammer projection turns the celestial sphere into a continuous 2:1 field while preserving area across the map.'],
  ['lensing', 'Paczyński amplification', 'A point-source, point-lens curve controls the size and intensity of each transient microlensing event.'],
  ['variable', 'Variable-star cycles', 'RR Lyrae, Cepheids, ZZ Ceti, LBV and cataclysmic variables receive class-specific stylised pulse profiles.'],
  ['motion', 'Linear space motion', 'Proper-motion vectors update stellar directions through time, optionally including Gaia radial velocity where available.'],
  ['observer', 'Moving viewpoint', 'Distance modulus and a changing sightline reconstruct the apparent sky from positions away from the Sun.'],
]

const technologies = [
  ['3.12', 'Python', 'Reproducible orchestration and command-line render workflows'],
  ['∑', 'NumPy', 'Vectorised catalogue transforms, memmaps and raster operations'],
  ['A', 'Astropy', 'FITS, time, units and astronomical coordinate systems'],
  ['ƒ', 'SciPy', 'Convolution, Gaussian filtering and numerical processing'],
  ['CV', 'OpenCV', 'High-throughput image operations on large frames'],
  ['P', 'Pillow', '16-bit image output, labels and frame validation'],
  ['▶', 'FFmpeg', 'H.264 and 10-bit HEVC animation masters'],
  ['G', 'Gaia Archive', 'ESA DR3 astrometry, photometry and transient catalogues'],
]

const outputRows = [
  ['All-sky map', '150M', 'Hammer', '16,384 × 8,192', '16-bit PNG'],
  ['Microlensing', 'Gaia events', 'Hammer', '16,384 × 8,192', 'HEVC 10-bit'],
  ['Variable stars', '5 classes', 'Hammer', '16,384 × 8,192', 'HEVC 10-bit'],
  ['Proper motion', '250K', 'Equirectangular', '1,920 × 960', 'H.264 MP4'],
  ['Observer', '500K', 'Equirectangular', '3,840 × 1,920', 'H.264 MP4'],
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
      <AtlasAnnouncement />
      <Header scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main id="main">
        <Hero />
        <Introduction />
        <Pipelines />
        <Results />
        <Science />
        <Engineering />
        <OutputMatrix />
        <Downloads />
        <Github />
      </main>
      <Footer />
    </div>
  )
}

function AtlasAnnouncement() {
  return (
    <a className="atlas-announcement" href="/microlensing-map">
      <span><i /> New interactive release</span>
      <strong>AURORA Microlensing Map</strong>
      <span>218 Gaia DR3 events · Open atlas ↗</span>
    </a>
  )
}

function Header({ scrolled, menuOpen, setMenuOpen }) {
  const closeMenu = () => setMenuOpen(false)
  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="wordmark" href="#top" aria-label="AURORA home"><span className="aurora-mark" aria-hidden="true"><i /><i /></span>AURORA</a>
      <nav className={menuOpen ? 'is-open' : ''} aria-label="Main navigation">
        <a href="#project" onClick={closeMenu}>Project</a>
        <a href="#pipelines" onClick={closeMenu}>Pipelines</a>
        <a href="#results" onClick={closeMenu}>Results</a>
        <a href="#science" onClick={closeMenu}>Science</a>
        <a href="/microlensing-map" onClick={closeMenu}>Event atlas</a>
        <a href="#outputs" onClick={closeMenu}>Outputs</a>
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
        <p className="eyebrow"><span /> Gaia DR3 · Five scientific pipelines</p>
        <h1 id="hero-title">AURORA</h1>
        <p className="expansion">Astronomical Unified Rendering<br />Of Relativistic Astrophysics</p>
        <p className="hero-copy">A data-to-image laboratory for the Milky Way: all-sky mapping, microlensing, variable stars, stellar proper motion and observer-dependent 3D views.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#pipelines">Explore pipelines <span>↓</span></a>
          <a className="button button-outline" href={GITHUB_URL} target="_blank" rel="noreferrer">Source code <span>↗</span></a>
          <a className="button button-quiet" href={DOCS_URL}>Documentation</a>
          <a className="button button-quiet" href="#outputs">Specifications</a>
        </div>
      </div>
      <div className="hero-index"><span>ALL-SKY / 16K / 16-BIT</span><span>5 PIPELINES · 9 PYTHON MODULES</span></div>
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
          <h2 id="intro-title">One catalogue.<br /><em>Five ways to move.</em></h2>
          <div className="intro-copy">
            <p>AURORA has grown from a single high-resolution sky renderer into a family of independent astronomical pipelines. Each path begins with measured data and ends in a reproducible visual result.</p>
            <p>The project now explores change as well as structure: gravity brightens a source, variable stars pulse, stars drift across millennia and the sky transforms when the observer leaves the Solar position.</p>
          </div>
        </div>
      </Reveal>
      <div className="stat-row">
        <Counter value={150} suffix="M" label="Gaia sources in the base map" />
        <Counter value={5} suffix="" label="Independent render pipelines" />
        <Counter value={500} suffix="K" label="Stars in the 3D observer model" />
        <Counter value={100} suffix="K yr" label="Proper-motion horizon" />
      </div>
    </section>
  )
}

function PipelineMark({ type }) {
  return (
    <div className={`pipeline-mark mark-${type}`} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  )
}

function Pipelines() {
  return (
    <section className="pipeline-shell" id="pipelines" aria-labelledby="pipelines-title">
      <div className="section pipeline">
        <Reveal className="section-heading split-heading">
          <div><p className="section-label">02 / Pipeline atlas</p><h2 id="pipelines-title">A wider view<br />of <em>stellar change.</em></h2></div>
          <p>The new architecture separates shared Gaia acquisition from specialised renderers. Proper motion and observer perspective can run without first creating the Hammer map.</p>
        </Reveal>
        <div className="pipeline-tracks">
          {pipelineTracks.map((track, index) => (
            <Reveal as="article" className={`pipeline-track pipeline-${track.type}`} key={track.title} delay={index * 55}>
              <div className="track-topline"><span>{track.number}</span><small>{track.label}</small></div>
              <PipelineMark type={track.type} />
              <h3>{track.title}</h3>
              <p>{track.copy}</p>
              <ul>{track.metrics.map((metric) => <li key={metric}>{metric}</li>)}</ul>
              <code>{track.route}</code>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Results() {
  const cards = [
    { kind: 'image', label: 'Foundation render', title: 'The Milky Way in Hammer projection', detail: '16K master · 16-bit PNG', src: '/assets/aurora-sky-preview.jpg' },
    { kind: 'video', label: 'Relativistic transient', title: 'Microlensing in motion', detail: 'Paczyński model · HEVC', src: '/assets/aurora-microlensing-preview.mp4', poster: '/assets/microlensing-poster.jpg' },
    { kind: 'image', label: 'Animation frame', title: 'Transient event field', detail: 'Sparse overlay render', src: '/assets/microlensing-poster.jpg' },
  ]

  return (
    <section className="results-shell" id="results" aria-labelledby="results-title">
      <div className="section">
        <Reveal className="section-heading split-heading">
          <div><p className="section-label">03 / Results</p><h2 id="results-title">Measured data,<br /><em>visible structure.</em></h2></div>
          <p>Browser-ready previews show the foundation map and the microlensing renderer. Full-resolution masters are distributed separately from the source repository.</p>
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
        <div><p className="section-label">04 / Science</p><h2 id="science-title">The models behind<br />the <em>motion.</em></h2></div>
        <p>Every visual effect is tied to a defined model or coordinate transform, with explicit limits on what the result should be interpreted to mean.</p>
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
      <Reveal className="science-note">
        <span>Interpretation boundary</span>
        <p>Long-range proper motion is a linear extrapolation, not an orbital integration. Observer travel changes viewpoint and apparent brightness, while the underlying stellar catalogue remains static.</p>
      </Reveal>
    </section>
  )
}

function Engineering() {
  const practices = [
    ['01', 'Resumable acquisition', 'Fifty deterministic Gaia ranges, retries and existing-chunk detection make the 150-million-source download recoverable.'],
    ['02', 'Memory-aware rendering', 'Chunked FITS reads, mapped arrays, tiled projection and overlap-add convolution keep 16K processing tractable.'],
    ['03', 'Configuration caches', 'Sparse overlay data or validated PNG frames are stored under configuration hashes and reused between runs.'],
    ['04', 'Safe outputs', 'Catalogue files are written atomically; corrupted cached frames are detected and generated again automatically.'],
  ]
  return (
    <section className="engineering-shell" aria-labelledby="engineering-title">
      <div className="section technology">
        <Reveal className="section-heading split-heading">
          <div><p className="section-label">05 / Engineering</p><h2 id="engineering-title">Designed for<br /><em>long computations.</em></h2></div>
          <p>The new pipelines are built to survive costly catalogue queries and high-resolution renders without discarding completed work.</p>
        </Reveal>
        <div className="practice-grid">
          {practices.map(([number, title, copy], index) => <Reveal as="article" className="practice-card" key={title} delay={index * 50}><span>{number}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}
        </div>
        <div className="tech-grid">
          {technologies.map(([icon, title, copy], index) => <Reveal as="article" className="tech-card" key={title} delay={(index % 4) * 45}><span>{icon}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}
        </div>
      </div>
    </section>
  )
}

function OutputMatrix() {
  return (
    <section className="section output-matrix" id="outputs" aria-labelledby="outputs-title">
      <Reveal className="section-heading split-heading">
        <div><p className="section-label">06 / Output matrix</p><h2 id="outputs-title">Five pipelines,<br /><em>clearly resolved.</em></h2></div>
        <p>Default production settings from the current codebase. Every animation uses a 2:1 full-sky frame and can be tested at smaller settings first.</p>
      </Reveal>
      <Reveal className="matrix-wrap">
        <div className="matrix-row matrix-header" aria-hidden="true"><span>Pipeline</span><span>Scale</span><span>Projection</span><span>Default frame</span><span>Output</span></div>
        {outputRows.map((row) => (
          <div className="matrix-row" key={row[0]}>
            {row.map((cell, index) => <span key={cell} data-label={['Pipeline', 'Scale', 'Projection', 'Default frame', 'Output'][index]}>{cell}</span>)}
          </div>
        ))}
      </Reveal>
      <div className="format-notes">
        <Reveal><strong>Python 3.12+</strong><span>Pinned numerical stack</span></Reveal>
        <Reveal delay={60}><strong>NPZ or CSV</strong><span>Motion catalogues</span></Reveal>
        <Reveal delay={120}><strong>libx264 / libx265</strong><span>Video encoding</span></Reveal>
        <Reveal delay={180}><strong>Config-hashed</strong><span>Validated frame caches</span></Reveal>
      </div>
    </section>
  )
}

function Downloads() {
  const items = [
    ['01', 'Source code', 'Explore all nine Python modules, renderer internals and catalogue-building workflows.', GITHUB_URL, 'Open repository'],
    ['02', 'Bilingual documentation', 'Follow the complete Polish and English setup, data-flow and quick-start guide.', DOCS_URL, 'Read documentation'],
    ['03', 'Full-resolution releases', 'Find large render masters and downloadable project outputs outside the source tree.', RELEASES_URL, 'View latest release'],
    ['04', 'Scientific methods', 'Review the equations, assumptions, cache strategy and interpretation limits.', `${DOCS_URL}#models-and-transformations`, 'Review methods'],
  ]
  return (
    <section className="section downloads" id="downloads" aria-labelledby="downloads-title">
      <Reveal className="section-heading split-heading"><div><p className="section-label">07 / Resources</p><h2 id="downloads-title">Run it.<br /><em>Inspect everything.</em></h2></div><p>The project documentation now covers every data path, input schema, default render and operational constraint.</p></Reveal>
      <div className="download-grid">
        {items.map(([number, title, copy, href, action], index) => <Reveal as="a" href={href} target="_blank" rel="noreferrer" className="download-card" key={title} delay={index * 60}><span>{number}</span><h3>{title}</h3><p>{copy}</p><strong>{action} <i>↗</i></strong></Reveal>)}
      </div>
    </section>
  )
}

function Github() {
  return (
    <section className="section github-section" aria-labelledby="github-title">
      <Reveal className="github-panel">
        <div className="github-copy"><p className="section-label">08 / Open research</p><h2 id="github-title">Observe the code.<br /><em>Extend the sky.</em></h2><p>AURORA is an MIT-licensed scientific rendering project built around public ESA Gaia DR3 data, explicit assumptions and reproducible outputs.</p><a className="button button-primary" href={GITHUB_URL} target="_blank" rel="noreferrer">Explore repository <span>↗</span></a></div>
        <dl>
          <div><dt>Scientific pipelines</dt><dd>5</dd></div>
          <div><dt>Python modules</dt><dd>9</dd></div>
          <div><dt>Runtime</dt><dd>Python 3.12+</dd></div>
          <div><dt>License</dt><dd>MIT</dd></div>
        </dl>
        <p className="api-note"><span /> Current project architecture · July 2026</p>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-brand"><a className="wordmark" href="#top"><span className="aurora-mark" aria-hidden="true"><i /><i /></span>AURORA</a><p>Astronomical Unified Rendering<br />Of Relativistic Astrophysics</p></div>
      <p>Created by Patryk Kropacz<br />Based on publicly available ESA Gaia DR3 data.</p>
      <nav aria-label="Footer navigation"><a href={GITHUB_URL}>GitHub</a><a href={DOCS_URL}>Documentation</a><a href={`${GITHUB_URL}/blob/main/LICENSE.txt`}>License</a></nav>
      <a className="back-to-top" href="#top">Return to orbit ↑</a>
    </footer>
  )
}
