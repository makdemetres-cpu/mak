import { api } from '../api'
import { CoinSearch } from '../components/CoinSearch'
import { clockTime } from '../format'
import { useApi } from '../hooks'

export function Home() {
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Home</h1>
        <p className="muted">
          Research coins with prices from Coinbase and Kraken. Every number shows where it came from and how old it is.
        </p>
      </div>
      <div className="grid-2">
        <section className="card" aria-labelledby="find-title">
          <div className="card-head">
            <h2 id="find-title">Find a coin</h2>
          </div>
          <CoinSearch />
        </section>
        <ExchangeStatusCard />
      </div>
    </>
  )
}

const STATUS_WORDS = { ok: 'Working', degraded: 'Limited', down: 'Down', unknown: 'Unknown' } as const

export function ExchangeStatusCard() {
  const status = useApi('status', api.exchangeStatus, 60_000)
  return (
    <section className="card" aria-labelledby="status-title">
      <div className="card-head">
        <h2 id="status-title">Exchange status</h2>
      </div>
      {!status.data && status.loading && <div className="skeleton" style={{ height: 96 }} />}
      {!status.data && status.error && <p className="small muted">{status.error.message}</p>}
      {status.data && (
        <ul className="list">
          {status.data.exchanges.map((e) => (
            <li key={e.source} style={{ padding: '12px 0' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="row" style={{ gap: 8 }}>
                  <span className={`status-dot status-${e.status}`} aria-hidden="true" />
                  <strong className="small">{e.source_name}</strong>
                </span>
                <span className="small">{STATUS_WORDS[e.status]}</span>
              </div>
              <p className="xsmall muted" style={{ marginTop: 4 }}>
                {e.description} {e.error && <span>({e.error})</span>}
              </p>
              <p className="xsmall faint">Checked {clockTime(e.checked_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
