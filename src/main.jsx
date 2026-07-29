import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import MicrolensingMapPage from './components/MicrolensingMapPage'
import './styles.css'

const isMicrolensingMap = window.location.pathname.replace(/\/+$/, '') === '/microlensing-map'
const RootView = isMicrolensingMap ? MicrolensingMapPage : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootView />
  </StrictMode>,
)
