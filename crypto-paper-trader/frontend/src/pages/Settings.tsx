import { CurrencyToggle, ThemeToggle } from '../components/bits'
import { usePrefs } from '../prefs'

export function Settings() {
  const { currencyError } = usePrefs()
  return (
    <>
      <h1>Settings</h1>
      <section className="card stack">
        <h2>Currency</h2>
        <p className="small muted">
          In euros, the app uses a coin’s own euro market on Coinbase or Kraken when one exists. When it doesn’t, the
          app converts the US dollar price with the European Central Bank’s daily reference rate and marks the price
          with ≈.
        </p>
        <div>
          <CurrencyToggle />
        </div>
        {currencyError && <p className="small" style={{ color: 'var(--loss)' }}>{currencyError}</p>}
      </section>
      <section className="card stack">
        <h2>Appearance</h2>
        <div>
          <ThemeToggle />
        </div>
      </section>
      <section className="card stack">
        <h2>Safety</h2>
        <ul className="small muted" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Paper money only. The app has no way to place real trades and refuses to contact exchange trading systems.</li>
          <li>The app only opens on this computer (address 127.0.0.1). Other devices on your network can’t reach it.</li>
          <li>Your data stays in the app folder. Nothing is sent anywhere except requests to the data sources.</li>
        </ul>
      </section>
    </>
  )
}
