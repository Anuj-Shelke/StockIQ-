interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GoogleIdentityApi {
  oauth2: {
    initTokenClient(config: {
      client_id: string
      scope: string
      callback: (response: GoogleTokenResponse) => void
      error_callback: (error: { type?: string }) => void
    }): { requestAccessToken: (options?: { prompt?: string }) => void }
  }
}

declare global {
  interface Window {
    google?: { accounts: GoogleIdentityApi }
  }
}

let scriptLoad: Promise<void> | null = null

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve()
  if (!scriptLoad) {
    scriptLoad = new Promise((resolve, reject) => {
      const current = document.querySelector<HTMLScriptElement>('script[data-stockiq-google-identity]')
      const script = current ?? document.createElement('script')
      const fail = () => {
        scriptLoad = null
        reject(new Error("Google sign-in couldn't load. Check your connection and try again."))
      }
      script.addEventListener('error', fail, { once: true })
      script.addEventListener('load', () => {
        if (window.google?.accounts.oauth2) resolve()
        else fail()
      }, { once: true })
      if (!current) {
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.dataset.stockiqGoogleIdentity = 'true'
        document.head.appendChild(script)
      }
      if (current && window.google?.accounts.oauth2) resolve()
    })
  }
  return scriptLoad
}

export async function requestGoogleAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  if (!clientId) throw new Error('Google sign-in is not configured. Use email and password or contact StockIQ support.')
  if (import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === 'true') {
    throw new Error('Google sign-in is unavailable while demo authentication is enabled.')
  }
  await loadGoogleIdentity()
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || 'Google sign-in was cancelled or could not be completed.'))
          return
        }
        resolve(response.access_token)
      },
      error_callback: (error) => {
        reject(new Error(error.type === 'popup_failed_to_open'
          ? 'The Google sign-in window was blocked. Allow pop-ups and try again.'
          : error.type === 'popup_closed'
            ? 'Google sign-in was cancelled.'
            : 'Google sign-in could not be completed. Please try again.'))
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}
