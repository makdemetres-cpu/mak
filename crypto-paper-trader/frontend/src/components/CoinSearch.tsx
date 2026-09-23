import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { api, type SearchResult, type SourceError } from '../api'
import { usePrefs } from '../prefs'
import { Link, navigate } from '../router'
import { CoinMark } from './bits'

function marketNote(r: SearchResult, currency: 'USD' | 'EUR'): string {
  const direct = r.markets[currency]
  if (direct.length) return `${currency} on ${direct.map((s) => (s === 'coinbase' ? 'Coinbase' : 'Kraken')).join(' and ')}`
  if (currency === 'EUR' && r.markets.USD.length) return 'No euro market, price converted from USD'
  return `No ${currency} market`
}

export function CoinSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const { currency } = usePrefs()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [errors, setErrors] = useState<SourceError[]>([])
  const [failure, setFailure] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const listId = useId()

  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(() => {
      api
        .search(query)
        .then((r) => {
          if (cancelled) return
          setResults(r.results)
          setErrors(r.errors)
          setFailure(null)
          setActive(0)
        })
        .catch((err: Error) => {
          if (!cancelled) setFailure(err.message)
        })
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [query])

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!results?.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      navigate(`/coin/${results[active].symbol}`)
    }
  }

  return (
    <div className="stack">
      <label htmlFor={`${listId}-input`} className="visually-hidden">
        Search coins
      </label>
      <input
        id={`${listId}-input`}
        className="input"
        type="search"
        placeholder="Search by name or symbol, like Bitcoin or BTC"
        value={query}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={!!results?.length}
        aria-controls={listId}
        aria-activedescendant={results?.length ? `${listId}-${active}` : undefined}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {failure && <p className="small" style={{ color: 'var(--loss)' }}>{failure}</p>}
      {errors.length > 0 && (
        <p className="small muted">
          Some coins may be missing: {errors.map((e) => e.message).join(' ')}
        </p>
      )}
      {results && results.length === 0 && (
        <p className="empty small">No coin matches “{query}” on Coinbase or Kraken.</p>
      )}
      {results && results.length > 0 && (
        <div>
          {!query && <p className="small muted" style={{ marginBottom: 8 }}>Popular coins</p>}
          <ul className="list" id={listId} role="listbox">
            {results.map((r, i) => (
              <li key={r.symbol} role="option" id={`${listId}-${i}`} aria-selected={i === active}>
                <Link href={`/coin/${r.symbol}`} className="list-link">
                  <span className="row" style={{ gap: 12 }}>
                    <CoinMark symbol={r.symbol} />
                    <span>
                      <strong>{r.name}</strong> <span className="muted">{r.symbol}</span>
                    </span>
                  </span>
                  <span className="xsmall faint">{marketNote(r, currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
