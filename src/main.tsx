import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ShadcnApp } from './ShadcnApp'
import { LanguageProvider } from './contexts/LanguageContext'
import { RuntimeProvider } from './runtime/RuntimeProvider'
import './App.css'
import './styles/themes.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <RuntimeProvider>
        <ShadcnApp />
      </RuntimeProvider>
    </LanguageProvider>
  </StrictMode>
)
