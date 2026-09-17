import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Sandbox from './SBSandbox.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sandbox />
  </StrictMode>,
)
