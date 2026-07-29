import React, { useEffect } from 'react'
import MapExplorer from './MapExplorer'

export default function MicrolensingMapPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'AURORA — Microlensing Event Atlas'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <div className="atlas-page">
      <header className="atlas-page-header">
        <a className="wordmark" href="/" aria-label="Return to AURORA home">
          <span className="aurora-mark" aria-hidden="true"><i /><i /></span>
          AURORA
        </a>
        <p>MICROLENSING EVENT ATLAS</p>
        <a className="atlas-back-link" href="/">Return to project <span>↗</span></a>
      </header>

      <main className="atlas-page-main">
        <div className="atlas-page-intro">
          <div>
            <p className="section-label">Gaia DR3 / Interactive map</p>
            <h1>Microlensing<br /><em>event atlas.</em></h1>
          </div>
          <p>Every marker is a measured Gaia event processed by <code>aurora_microlensing_map.py</code>. Navigate the Hammer sky, filter event timescales and open a source to study its physical model.</p>
        </div>
        <MapExplorer />
      </main>

      <footer className="atlas-page-footer">
        <p>AURORA · Astronomical Unified Rendering Of Relativistic Astrophysics</p>
        <p>Gaia DR3 · 218 valid microlensing events · PSPL model</p>
      </footer>
    </div>
  )
}
