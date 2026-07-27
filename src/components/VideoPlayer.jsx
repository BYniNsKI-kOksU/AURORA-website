import { useEffect, useRef, useState } from 'react'

export default function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    const video = videoRef.current
    if (video.paused) video.play()
    else video.pause()
  }

  useEffect(() => {
    const video = videoRef.current
    const update = () => { setProgress(video.currentTime); setDuration(video.duration || 0) }
    video.addEventListener('timeupdate', update)
    video.addEventListener('loadedmetadata', update)
    return () => { video.removeEventListener('timeupdate', update); video.removeEventListener('loadedmetadata', update) }
  }, [])

  return (
    <div className="video-player">
      <video ref={videoRef} src={src} poster={poster} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button className="video-main-control" type="button" onClick={togglePlay} aria-label={playing ? 'Pause microlensing simulation' : 'Play microlensing simulation'}>{playing ? 'Ⅱ' : '▶'}</button>
      <div className="video-controls"><button type="button" onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button><input type="range" min="0" max={duration || 0} step=".1" value={progress} onChange={(event) => { videoRef.current.currentTime = Number(event.target.value); setProgress(Number(event.target.value)) }} aria-label="Video progress" /><button type="button" onClick={() => videoRef.current.requestFullscreen?.()}>Fullscreen</button></div>
    </div>
  )
}
