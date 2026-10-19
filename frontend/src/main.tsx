import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { MOCK_AUTH } from './services/api.ts'
import { GlossaryTooltipProvider } from './components/ui/GlossaryTooltip.tsx'

async function bootstrap() {
  // DEV ONLY: serve the auth endpoints from a mock until the FastAPI backend implements them.
  if (MOCK_AUTH) {
    const { installMockBackend } = await import('./services/mockBackend.ts')
    installMockBackend()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <GlossaryTooltipProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </GlossaryTooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

void bootstrap()
