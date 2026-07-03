import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './shared/context/ThemeContext.jsx'
import { ToastProvider } from './shared/context/ToastContext.jsx'
import { initFetchCache } from './shared/utils/fetchCache.js'

initFetchCache();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)

