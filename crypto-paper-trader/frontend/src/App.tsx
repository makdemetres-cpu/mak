import { CurrencyToggle, ThemeToggle } from './components/bits'
import { CoinPage } from './pages/CoinPage'
import { Home } from './pages/Home'
import { Later } from './pages/Later'
import { Research } from './pages/Research'
import { Settings } from './pages/Settings'
import { usePrefs } from './prefs'
import { Link, usePath } from './router'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/research', label: 'Research' },
  { href: '/paper', label: 'Paper Trading' },
  { href: '/copy', label: 'Copy Trading' },
  { href: '/assistant', label: 'AI Assistant' },
  { href: '/learn', label: 'Learn the Words' },
  { href: '/settings', label: 'Settings' },
]

function section(path: string): string {
  if (path.startsWith('/coin/')) return '/research'
  return NAV.find((n) => n.href !== '/' && path.startsWith(n.href))?.href ?? '/'
}

function Page({ path }: { path: string }) {
  const coin = path.match(/^\/coin\/([A-Za-z0-9]{1,15})\/?$/)
  if (coin) return <CoinPage key={coin[1].toUpperCase()} symbol={coin[1].toUpperCase()} />
  switch (section(path)) {
    case '/research':
      return <Research />
    case '/paper':
      return <Later title="Paper Trading" summary="Practice buying and selling with pretend money, using real prices." />
    case '/copy':
      return (
        <Later
          title="Copy Trading"
          summary="See which funds hold Bitcoin and Ether funds, and what crypto members of Congress report trading."
        />
      )
    case '/assistant':
      return <Later title="AI Assistant" summary="Ask questions about a coin. Answers use only data the app fetched, with sources." />
    case '/learn':
      return <Later title="Learn the Words" summary="Every trading word the app uses, explained simply with a picture." />
    case '/settings':
      return <Settings />
    default:
      return <Home />
  }
}

export function App() {
  const path = usePath()
  const current = section(path)
  const { currencyError } = usePrefs()
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <img src="/favicon.svg" alt="" />
          Crypto Paper Trader
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="badge badge-neutral" style={{ alignSelf: 'flex-start' }}>
            Paper money only
          </span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          {currencyError && <span className="xsmall" style={{ color: 'var(--loss)' }}>{currencyError}</span>}
          <CurrencyToggle />
          <ThemeToggle />
        </header>
        <main className="content">
          <Page path={path} />
        </main>
        <footer className="disclaimer">
          Research and practice tool. Paper money only, no real trades. Not financial advice: even correct data can’t
          guarantee a profit.
        </footer>
      </div>
    </div>
  )
}
