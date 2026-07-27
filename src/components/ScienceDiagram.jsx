import React from 'react'

const diagrams = {
  gaia: <><circle cx="120" cy="58" r="10" /><path d="M120 58L33 94M120 58l72 59M120 58l-49-38M120 58l67-23" /><circle cx="33" cy="94" r="3" /><circle cx="192" cy="117" r="4" /><circle cx="71" cy="20" r="2" /><circle cx="187" cy="35" r="3" /><path className="accent" d="M105 73a27 27 0 0 0 29 5" /></>,
  hammer: <><path d="M18 72C18 32 56 14 120 14s102 18 102 58-38 58-102 58S18 112 18 72Z" /><path d="M120 14v116M18 72h204M39 38c42 19 120 19 162 0M39 106c42-19 120-19 162 0M73 20c-24 33-24 71 0 104M167 20c24 33 24 71 0 104" /><circle className="accent-fill" cx="144" cy="55" r="4" /></>,
  blackbody: <><path d="M15 120C48 119 61 106 75 73s18-54 35-54 20 48 34 61 30 25 81 31" /><path className="accent" d="M15 120C48 119 61 106 75 73s18-54 35-54 20 48 34 61 30 25 81 31" /><path d="M15 126h210M27 126v-7M78 126v-7M129 126v-7M180 126v-7" /><circle className="accent-fill" cx="109" cy="20" r="4" /></>,
  temperature: <><defs><linearGradient id="temp-gradient"><stop stopColor="#f4a06b" /><stop offset=".48" stopColor="#fff3d8" /><stop offset="1" stopColor="#79caff" /></linearGradient></defs><rect x="16" y="61" width="208" height="17" rx="8.5" fill="url(#temp-gradient)" stroke="none" /><path d="M16 91v12m52-12v12m52-12v12m52-12v12m52-12v12" /><text x="15" y="119">3,000 K</text><text x="177" y="119">40,000 K</text><circle className="accent" cx="173" cy="69.5" r="17" /></>,
  galactic: <><ellipse cx="120" cy="72" rx="100" ry="49" /><ellipse cx="120" cy="72" rx="65" ry="49" /><path d="M20 72h200M120 23v98M53 38c37 26 97 26 134 0M53 106c37-26 97-26 134 0" /><path className="accent" d="M120 72l61-24" /><circle className="accent-fill" cx="181" cy="48" r="4" /><text x="184" y="43">l,b</text></>,
  lensing: <><path d="M13 116h214M120 16v110" /><path className="accent" d="M15 111c56 0 77-1 89-21 8-13 8-67 16-72 8 5 8 59 16 72 12 20 33 21 89 21" /><path d="M73 29c25-15 69-15 94 0" strokeDasharray="3 5" /><circle cx="120" cy="18" r="5" /></>,
}

export default function ScienceDiagram({ type }) {
  return <svg className={`science-diagram diagram-${type}`} viewBox="0 0 240 145" role="img" aria-label={`${type} scientific diagram`}>{diagrams[type]}</svg>
}
