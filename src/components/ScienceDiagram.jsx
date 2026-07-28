import React from 'react'

const diagrams = {
  gaia: <><circle cx="120" cy="58" r="10" /><path d="M120 58L33 94M120 58l72 59M120 58l-49-38M120 58l67-23" /><circle cx="33" cy="94" r="3" /><circle cx="192" cy="117" r="4" /><circle cx="71" cy="20" r="2" /><circle cx="187" cy="35" r="3" /><path className="accent" d="M105 73a27 27 0 0 0 29 5" /></>,
  hammer: <><path d="M18 72C18 32 56 14 120 14s102 18 102 58-38 58-102 58S18 112 18 72Z" /><path d="M120 14v116M18 72h204M39 38c42 19 120 19 162 0M39 106c42-19 120-19 162 0M73 20c-24 33-24 71 0 104M167 20c24 33 24 71 0 104" /><circle className="accent-fill" cx="144" cy="55" r="4" /></>,
  blackbody: <><path d="M15 120C48 119 61 106 75 73s18-54 35-54 20 48 34 61 30 25 81 31" /><path className="accent" d="M15 120C48 119 61 106 75 73s18-54 35-54 20 48 34 61 30 25 81 31" /><path d="M15 126h210M27 126v-7M78 126v-7M129 126v-7M180 126v-7" /><circle className="accent-fill" cx="109" cy="20" r="4" /></>,
  temperature: <><defs><linearGradient id="temp-gradient"><stop stopColor="#f4a06b" /><stop offset=".48" stopColor="#fff3d8" /><stop offset="1" stopColor="#79caff" /></linearGradient></defs><rect x="16" y="61" width="208" height="17" rx="8.5" fill="url(#temp-gradient)" stroke="none" /><path d="M16 91v12m52-12v12m52-12v12m52-12v12m52-12v12" /><text x="15" y="119">3,000 K</text><text x="177" y="119">40,000 K</text><circle className="accent" cx="173" cy="69.5" r="17" /></>,
  galactic: <><ellipse cx="120" cy="72" rx="100" ry="49" /><ellipse cx="120" cy="72" rx="65" ry="49" /><path d="M20 72h200M120 23v98M53 38c37 26 97 26 134 0M53 106c37-26 97-26 134 0" /><path className="accent" d="M120 72l61-24" /><circle className="accent-fill" cx="181" cy="48" r="4" /><text x="184" y="43">l,b</text></>,
  lensing: <><path d="M13 116h214M120 16v110" /><path className="accent" d="M15 111c56 0 77-1 89-21 8-13 8-67 16-72 8 5 8 59 16 72 12 20 33 21 89 21" /><path d="M73 29c25-15 69-15 94 0" strokeDasharray="3 5" /><circle cx="120" cy="18" r="5" /></>,
  variable: <><path d="M14 119h212M20 18v108" /><path className="accent" d="M20 89c10-2 14-7 18-24s7-31 12-31 7 35 11 43 9 11 18 12c11-2 15-8 20-26s7-29 12-29 7 34 11 42 9 12 18 13c11-2 15-8 20-26s7-29 12-29 7 34 11 42 9 12 18 13" /><path d="M20 101c30-16 58-16 88 0s58 16 98 0" strokeDasharray="3 5" /><text x="174" y="113">18 DAYS</text></>,
  motion: <><circle cx="53" cy="89" r="5" /><circle cx="102" cy="68" r="4" /><circle cx="165" cy="42" r="6" /><circle cx="197" cy="96" r="3" /><path className="accent" d="M53 89l42-18m7-3 54-22m9-4 29 49" /><path d="M88 67l7 4-2 8m56-29 7-4-1 8m34 30 5 7-9 1" /><path d="M18 119h204" strokeDasharray="2 6" /><text x="18" y="134">EPOCH 2016.0</text><text x="170" y="134">+100 KYR</text></>,
  observer: <><ellipse cx="126" cy="72" rx="88" ry="38" /><ellipse cx="126" cy="72" rx="55" ry="23" /><path d="M38 72h176M126 34v76" /><circle className="accent-fill" cx="126" cy="72" r="4" /><circle cx="48" cy="103" r="5" /><path className="accent" d="M126 72C98 69 73 79 48 103" /><path d="M57 94l-9 9 13 2" /><text x="133" y="66">SUN</text><text x="22" y="119">OBSERVER</text></>,
}

export default function ScienceDiagram({ type }) {
  return <svg className={`science-diagram diagram-${type}`} viewBox="0 0 240 145" role="img" aria-label={`${type} scientific diagram`}>{diagrams[type]}</svg>
}
