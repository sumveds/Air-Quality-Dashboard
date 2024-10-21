import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* This is the component where all the codes are written. We are importing it here for React to render it to the screen. */}
    <App />
  </StrictMode>,
)
