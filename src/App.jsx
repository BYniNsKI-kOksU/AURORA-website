import { useEffect, useState } from 'react'
import microlensingPoster from '../results/microlensing-poster.jpg'
import microlensingVideo from '../results/aurora-microlensing-preview.mp4'
import MapExplorer, { CardFooter } from './components/MapExplorer'
import StarField from './components/StarField'

const stats = [
  ['150M+', 'Gaia DR3 sources'],
  ['32K', 'All-sky rendering'],
  ['10-bit', 'H.265 / HEVC output'],
  ['6×', 'Parallel render workers'],
]

const pipeline = [
  ['01', 'Gaia DR3', 'ADQL catalogues'],
  ['02', 'Stellar properties', 'Flux & temperature'],
  ['03', 'Hammer sky', 'Equal-area projection'],
  ['04', 'PSF render', 'Moffat + FFT'],
  ['05', 'Relativity', 'Microlensing events'],
  ['06', 'Master output', 'HEVC 10-bit video'],
]

export default function App() {
  const [glow, setGlow] = useState({ x: -500, y: -500 })

  useEffect(() => {
    const updateGlow = (event) => setGlow({ x: event.clientX, y: event.clientY })
    window.addEventListener('pointermove', updateGlow)
    return () => window.removeEventListener('pointermove', updateGlow)
  }, [])

  return (
    <div className="app-shell">
      <div className="cursor-glow" aria-hidden="true" style={{ left: glow.x, top: glow.y }} />
      <Header />
      <main>
        <Hero />
        <Introduction />
        <Visualisation />
        <Pipeline />
        <Science />
        <Data />
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  return <header className="site-header"><a className="wordmark" href="#top" aria-label="AURORA home"><span className="mark">✦</span>AURORA</a><nav aria-label="Main navigation"><a href="#science">Science</a><a href="#visualization">Visualisation</a><a href="#pipeline">Pipeline</a><a href="#data">Data</a></nav><a className="header-link" href="../README.md">Documentation <span>↗</span></a></header>
}

function Hero() {
  return <section className="hero" id="top" aria-labelledby="hero-title"><StarField /><div className="orbital-line line-one" aria-hidden="true" /><div className="orbital-line line-two" aria-hidden="true" /><div className="hero-content"><p className="eyebrow"><span /> Gaia DR3 / High-resolution astrophysics</p><h1 id="hero-title">AURORA</h1><p className="expansion">Astronomical Unified Rendering<br />Of Relativistic Astrophysics</p><p className="hero-copy">A high-resolution astronomical renderer that turns Gaia DR3 into a physically motivated Milky Way — and brings transient relativistic events into view.</p><div className="hero-actions"><a className="button button-primary" href="#visualization">Explore the simulation <span>↓</span></a><a className="button button-ghost" href="../README.md">Read the project <span>↗</span></a></div></div><div className="hero-meta"><span>01 — ALL-SKY RENDER</span><span>Galactic coordinate system</span></div><a className="scroll-cue" href="#intro"><i />Scroll to enter</a></section>
}

function Introduction() {
  return <section className="intro section" id="intro" aria-labelledby="intro-title"><p className="section-label">01 / The project</p><div className="intro-grid"><h2 id="intro-title">A computational<br /><em>portrait</em> of our galaxy.</h2><div className="intro-copy"><p>AURORA transforms a catalog of more than one hundred million Gaia DR3 stars into a large-format representation of the Milky Way, then simulates gravitational microlensing as it unfolds across that sky.</p><a className="text-link" href="#pipeline">Follow the data pipeline <span>→</span></a></div></div><div className="stat-row">{stats.map(([value, label]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div></section>
}

function Visualisation() {
  return <section className="gallery section" id="visualization" aria-labelledby="gallery-title"><SectionHeading label="02 / Observation deck" title={<>Rendered from the<br /><em>catalogue outward.</em></>} copy="Use the map to inspect the all-sky frame. The gallery uses lightweight previews; AURORA’s original assets are rendered at up to 32K." /><div className="gallery-grid"><MapExplorer /><article className="video-card"><div className="video-wrap"><video controls muted loop playsInline poster={microlensingPoster}><source src={microlensingVideo} type="video/mp4" />Your browser does not support video playback.</video><span className="video-label">SIMULATION / T + 00:24</span></div><CardFooter kicker="Gravitational microlensing" title="Light curves in motion" detail="Paczynski model" /></article></div></section>
}

function Pipeline() {
  return <section className="pipeline section" id="pipeline" aria-labelledby="pipeline-title"><div className="pipeline-heading"><p className="section-label">03 / From source to signal</p><h2 id="pipeline-title">A data pipeline designed<br />for <em>cosmic scale.</em></h2></div><ol className="pipeline-flow">{pipeline.map(([number, title, description]) => <li key={number}><span>{number}</span><strong>{title}</strong><small>{description}</small></li>)}</ol><div className="pipeline-note"><span>PROCESSING NOTE</span><p>Each star is placed in a spherical histogram, coloured by its flux-weighted effective temperature, then shaped through Gaussian smoothing, a dual Moffat PSF and dynamic-range compression.</p></div></section>
}

function Science() {
  return <section className="science section" id="science" aria-labelledby="science-title"><SectionHeading label="04 / Physical model" title={<>The physics behind<br />the <em>glow.</em></>} copy="Three simple ideas form the visual language of AURORA: stellar temperature, a projection that respects area, and the transient magnification of gravity." /><div className="science-grid"><article className="science-card thermal"><span>01</span><h3>Stellar rendering</h3><p>Gaia G-band flux and effective temperature are transformed into the map’s luminous, temperature-dependent RGB field.</p><div className="temperature-scale"><i /><b>3,000 K</b><b>40,000 K</b></div></article><article className="science-card projection"><span>02</span><h3>Galactic structure</h3><p>Galactic longitude and latitude are mapped to a Hammer projection, preserving area across the celestial sphere.</p><div className="projection-sketch"><i /><i /><i /><em>l, b → x<sub>H</sub>, y<sub>H</sub></em></div></article><article className="science-card lens"><span>03</span><h3>Microlensing</h3><p>The Paczyński curve defines how a foreground lens amplifies the background star as their alignment evolves in time.</p><svg className="light-curve" viewBox="0 0 290 105" role="img" aria-label="Stylised Paczynski microlensing light curve"><path d="M2 88 C95 88 111 88 123 78 C133 70 136 15 145 8 C154 15 157 70 167 78 C179 88 195 88 288 88" /><path className="axis" d="M2 89H288M145 4V100" /><text x="6" y="18">A(t)</text><text x="270" y="101">t</text></svg></article></div></section>
}

function Data() {
  const technical = [['Language', 'Python 3.9+'], ['Data', 'ESA Gaia DR3'], ['Projection', 'Hammer equal-area'], ['Rendering', 'NumPy · SciPy · Matplotlib'], ['Video', 'FFmpeg · H.265 / 10-bit']]
  return <section className="data section" id="data" aria-labelledby="data-title"><div className="data-panel"><div><p className="section-label">05 / Research record</p><h2 id="data-title">Built for resolution.<br /><em>Grounded in data.</em></h2><p className="data-copy">AURORA is an independent research and visualisation project based on publicly available ESA Gaia DR3 data.</p><a className="button button-primary" href="../README.md#pliki-wynikowe">View output inventory <span>→</span></a></div><dl>{technical.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl></div></section>
}

function SectionHeading({ label, title, copy }) {
  return <div className="section-heading"><div><p className="section-label">{label}</p><h2>{title}</h2></div><p>{copy}</p></div>
}

function Footer() {
  return <footer><div className="footer-wordmark"><span className="mark">✦</span> AURORA</div><p>Astronomical Unified Rendering Of Relativistic Astrophysics</p><p>Created by Patryk Kropacz · Based on public ESA Gaia DR3 data.</p><a href="#top">Back to orbit ↑</a></footer>
}
