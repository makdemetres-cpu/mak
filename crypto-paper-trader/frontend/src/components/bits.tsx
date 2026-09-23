import type { Currency, Freshness, Notice, SourceError } from '../api'
import { clockTime, signedPct } from '../format'
import { usePrefs } from '../prefs'

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <span className={`badge badge-${freshness.status}`} title={freshness.detail}>
      <span className="dot" aria-hidden="true" />
      {freshness.label}
    </span>
  )
}

export function Change({ pct, suffix, missing }: { pct: number | null; suffix?: string; missing?: string }) {
  if (pct === null || !Number.isFinite(pct)) return <span className="change-flat">{missing ?? 'Change not available'}</span>
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■'
  const words = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'unchanged'
  return (
    <span className={`change-${dir} num`}>
      <span aria-hidden="true">{arrow} </span>
      <span className="visually-hidden">{words} </span>
      {signedPct(pct)}
      {suffix && <span className="muted"> {suffix}</span>}
    </span>
  )
}

const ICONS = { info: 'i', warning: '!', danger: '!' } as const

export function Notices({ notices }: { notices: Notice[] }) {
  if (!notices.length) return null
  const order = { danger: 0, warning: 1, info: 2 }
  const sorted = [...notices].sort((a, b) => order[a.level] - order[b.level])
  return (
    <div className="stack" role="status">
      {sorted.map((n) => (
        <div key={n.code + n.message} className={`notice notice-${n.level}`}>
          <span className="notice-icon" aria-hidden="true">
            {ICONS[n.level]}
          </span>
          <span>{n.message}</span>
        </div>
      ))}
    </div>
  )
}

export function SourceErrors({ errors }: { errors: SourceError[] }) {
  if (!errors.length) return null
  return (
    <details className="small muted">
      <summary>
        {errors.length === 1 ? '1 source had a problem' : `${errors.length} sources had problems`}
      </summary>
      <ul>
        {errors.map((e) => (
          <li key={e.source + e.at + e.message}>
            {e.message} <span className="faint">({clockTime(e.at)})</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function CurrencyToggle() {
  const { currency, setCurrency } = usePrefs()
  const options: Currency[] = ['USD', 'EUR']
  return (
    <div className="segmented" role="group" aria-label="Show prices in">
      {options.map((c) => (
        <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}>
          {c === 'USD' ? '$ USD' : '€ EUR'}
        </button>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = usePrefs()
  return (
    <button type="button" className="btn" onClick={toggleTheme}>
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}

export function CoinMark({ symbol }: { symbol: string }) {
  return (
    <span className="coin-mark" aria-hidden="true">
      {symbol.slice(0, 4)}
    </span>
  )
}
