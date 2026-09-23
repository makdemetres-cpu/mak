import { CoinSearch } from '../components/CoinSearch'

export function Research() {
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Research</h1>
        <p className="muted">Search any coin traded on Coinbase or Kraken.</p>
      </div>
      <section className="card">
        <CoinSearch autoFocus />
      </section>
    </>
  )
}
