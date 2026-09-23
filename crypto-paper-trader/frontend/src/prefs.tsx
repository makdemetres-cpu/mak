import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type Currency } from './api'

type Theme = 'light' | 'dark'

interface Prefs {
  currency: Currency
  setCurrency: (c: Currency) => void
  currencyError: string | null
  theme: Theme
  toggleTheme: () => void
}

const PrefsContext = createContext<Prefs | null>(null)
const THEME_KEY = 'theme'

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [currencyError, setCurrencyError] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme())

  useEffect(() => {
    api
      .settings()
      .then((s) => setCurrencyState(s.currency))
      .catch(() => setCurrencyError('Couldn’t load your saved currency. Showing USD.'))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next)
    api
      .saveSettings({ currency: next })
      .then(() => setCurrencyError(null))
      .catch(() => setCurrencyError('Couldn’t save your currency choice. It will reset when you restart.'))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* storage blocked: the choice lasts until the page reloads */
      }
      return next
    })
  }, [])

  return (
    <PrefsContext.Provider value={{ currency, setCurrency, currencyError, theme, toggleTheme }}>
      {children}
    </PrefsContext.Provider>
  )
}

export function usePrefs(): Prefs {
  const prefs = useContext(PrefsContext)
  if (!prefs) throw new Error('usePrefs must be used inside PrefsProvider')
  return prefs
}
