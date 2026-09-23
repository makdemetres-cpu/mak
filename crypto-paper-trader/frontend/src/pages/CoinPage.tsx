import { useState } from 'react'
import { api, type CandleReport, type QuoteReport, type RangeKey } from '../api'
import { Change, CoinMark, FreshnessBadge, Notices, SourceErrors } from '../components/bits'
import { CoinSearch } from '../components/CoinSearch'
import { PriceChart, type ChartStyle } from '../components/PriceChart'
import { ago, amount, clockTime, intervalLabel, money } from '../format'
import { useApi, useNow } from '../hooks'
import { usePrefs } from '../prefs'
import { Link } from '../router'

const RANGES: RangeKey[] = ['1D', '1W', '1M', '1Y', '5Y']
const RANGE_NAMES: Record<RangeKey, string> = {
  '1D': '1 day',
  '1W': '1 week',
  '1M': '1 month',
  '1Y': '1 year',
  '5Y': '5 years',
}

export function CoinPage({ symbol }: { symbol: string }) {
  const { currency } = usePrefs()
  const now = useNow()
  const [range, setRange] = useState<RangeKey>('1D')
  const [style, setStyle] = useState<ChartStyle>('line')

  const quote = useApi(`${symbol}:${currency}`, () => api.quote(symbol, currency), 15_000)
  const chart = useApi(
    `${symbol}:${currency}:${range}`,
    () => api.candles(symbol, currency, range),
    range === '1D' ? 60_000 : 5 * 60_000,
  )

  if (quote.error?.status === 404) {
    return (
      <>
        <h1>Coin not found</h1>
        <p className="muted">{quote.error.message}</p>
        <div className="card">
          <CoinSearch autoFocus />
        </div>
      </>
    )
  }

  return (
    <>
      <nav className="small muted" aria-label="Breadcrumb">
        <Link href="/research">Research</Link> <span className="faint">/</span> {quote.data?.name ?? symbol}
      </nav>
      <div className="grid-2">
        <div className="stack" style={{ gap: 24 }}>
          <PriceHeader symbol={symbol} report={quote.data} loading={quote.loading} refreshError={quote.error?.message ?? null} now={now} />
          <section className="card" aria-labelledby="chart-title">
            <div className="card-head">
              <h2 id="chart-title">Price chart</h2>
              <div className="row">
                <div className="segmented" role="group" aria-label="Time range">
                  {RANGES.map((r) => (
                    <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} title={RANGE_NAMES[r]}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="segmented" role="group" aria-label="Chart style">
                  <button type="button" aria-pressed={style === 'line'} onClick={() => setStyle('line')}>
                    Line
                  </button>
                  <button type="button" aria-pressed={style === 'candles'} onClick={() => setStyle('candles')}>
                    Candles
                  </button>
                </div>
              </div>
            </div>
            <ChartBody report={chart.data} loading={chart.loading} error={chart.error?.message ?? null} style={style} />
          </section>
        </div>
        <div className="stack" style={{ gap: 24 }}>
          <DayStats report={quote.data} />
          <PriceCheck report={quote.data} />
        </div>
      </div>
    </>
  )
}

function PriceHeader({
  symbol,
  report,
  loading,
  refreshError,
  now,
}: {
  symbol: string
  report: QuoteReport | null
  loading: boolean
  refreshError: string | null
  now: number
}) {
  const { currency } = usePrefs()
  return (
    <section className="card stack" aria-labelledby="coin-title">
      <div className="row">
        <CoinMark symbol={symbol} />
        <h1 id="coin-title">
          {report && report.name !== symbol ? (
            <>
              {report.name} <span className="muted" style={{ fontWeight: 500 }}>{symbol}</span>
            </>
          ) : (
            symbol
          )}
        </h1>
      </div>

      {!report && loading && <div className="skeleton" style={{ height: 52, width: 260 }} />}
      {!report && !loading && refreshError && <Notices notices={[{ code: 'load', level: 'danger', message: refreshError }]} />}

      {report && (
        <>
          <div>
            {report.price ? (
              <p className="hero-price" aria-live="polite">
                {report.converted && <span title="Converted from US dollars">≈ </span>}
                {money(report.price.value, currency)}
              </p>
            ) : (
              <p className="hero-price faint">No price</p>
            )}
            {report.price && (
              <p style={{ marginTop: 6 }}>
                <Change
                  pct={report.price.change_24h_pct}
                  suffix="in the last 24 hours"
                  missing={`24-hour change not given by ${report.source?.name ?? 'this source'}`}
                />
              </p>
            )}
          </div>

          <div className="source-line">
            <FreshnessBadge freshness={report.freshness} />
            {report.source && (
              <>
                <span>
                  Price from {report.source.name} ({report.source.pair})
                </span>
                <span className="sep">·</span>
                <span>last trade {clockTime(report.source.observed_at)}</span>
                <span className="sep">·</span>
                <span>checked {ago(report.checked_at, now)}</span>
              </>
            )}
            {report.fx && (
              <>
                <span className="sep">·</span>
                <span>
                  ECB rate {report.fx.rate_date}: 1 EUR = {report.fx.rate_usd_per_eur.toFixed(4)} USD
                </span>
              </>
            )}
          </div>
          {report.freshness.status !== 'live' && <p className="xsmall muted">{report.freshness.detail}</p>}

          {refreshError && (
            <Notices
              notices={[
                {
                  code: 'local',
                  level: 'danger',
                  message: `${refreshError} The numbers shown are from ${clockTime(report.checked_at)}.`,
                },
              ]}
            />
          )}
          <Notices notices={report.notices} />
          <SourceErrors errors={report.errors} />
        </>
      )}
    </section>
  )
}

function ChartBody({
  report,
  loading,
  error,
  style,
}: {
  report: CandleReport | null
  loading: boolean
  error: string | null
  style: ChartStyle
}) {
  if (!report) {
    return (
      <div className="chart-box">
        <div className="chart-empty">{loading ? <div className="skeleton" style={{ inset: 0, position: 'absolute' }} /> : error}</div>
      </div>
    )
  }
  return (
    <div className="stack">
      {report.candles.length ? (
        <PriceChart
          candles={report.candles}
          currency={report.currency}
          style={style}
          intervalSeconds={report.interval_seconds}
        />
      ) : (
        <div className="chart-box">
          <div className="chart-empty">No chart data is available for this range right now.</div>
        </div>
      )}
      <div className="source-line">
        <FreshnessBadge freshness={report.freshness} />
        {report.source && (
          <>
            <span>
              Chart from {report.source.name} ({report.source.pair})
            </span>
            <span className="sep">·</span>
            <span>{intervalLabel(report.interval_seconds)}</span>
            <span className="sep">·</span>
            <span>fetched {clockTime(report.source.fetched_at)}</span>
          </>
        )}
      </div>
      <p className="xsmall muted">{report.freshness.detail}</p>
      {error && (
        <Notices notices={[{ code: 'local', level: 'danger', message: `${error} This chart is from ${clockTime(report.checked_at)}.` }]} />
      )}
      <Notices notices={report.notices} />
      <SourceErrors errors={report.errors} />
    </div>
  )
}

function DayStats({ report }: { report: QuoteReport | null }) {
  const { currency } = usePrefs()
  const p = report?.price
  const spread = p?.bid && p?.ask ? p.ask - p.bid : null
  const missing = report?.source ? `Not given by ${report.source.name}` : '—'
  const show = (v: number | null | undefined) => (v === null || v === undefined ? <span className="faint small">{missing}</span> : money(v, currency))
  return (
    <section className="card" aria-labelledby="day-title">
      <div className="card-head">
        <h2 id="day-title">Last 24 hours</h2>
      </div>
      {!report ? (
        <div className="skeleton" style={{ height: 180 }} />
      ) : !p ? (
        <p className="small muted">No numbers to show while the price is unavailable.</p>
      ) : (
        <>
          <dl className="stat-list">
            <dt>High</dt>
            <dd>{show(p.high_24h)}</dd>
            <dt>Low</dt>
            <dd>{show(p.low_24h)}</dd>
            <dt>Price 24 hours ago</dt>
            <dd>{show(p.open_24h)}</dd>
            <dt>Volume</dt>
            <dd>
              {p.volume_24h === null ? (
                <span className="faint small">{missing}</span>
              ) : (
                `${amount(p.volume_24h)} ${report.symbol}`
              )}
            </dd>
            <dt>Best bid (buyers)</dt>
            <dd>{show(p.bid)}</dd>
            <dt>Best ask (sellers)</dt>
            <dd>{show(p.ask)}</dd>
            <dt>Spread</dt>
            <dd>{show(spread)}</dd>
          </dl>
          {report.source && <p className="xsmall faint" style={{ marginTop: 16 }}>All from {report.source.name}, {report.source.pair}.</p>}
        </>
      )}
    </section>
  )
}

function PriceCheck({ report }: { report: QuoteReport | null }) {
  const { currency } = usePrefs()
  if (!report) return null
  const { status, threshold_pct, comparisons } = report.cross_check
  const summary =
    status === 'agree'
      ? `The other sources agree within ${threshold_pct}%.`
      : status === 'disagree'
        ? 'The sources disagree. Be careful with this price.'
        : 'We couldn’t compare with a second source right now.'
  return (
    <section className="card" aria-labelledby="check-title">
      <div className="card-head">
        <h2 id="check-title">Price check</h2>
      </div>
      <p className="small" style={{ color: status === 'disagree' ? 'var(--warn)' : undefined }}>
        {summary}
      </p>
      <div style={{ marginTop: 8 }}>
        {comparisons.map((c) => (
          <div key={c.source} className="check-row">
            <span>{c.source_name}</span>
            <span className="num" style={{ textAlign: 'right' }}>
              {c.price === null ? '—' : `${report.converted ? '≈ ' : ''}${money(c.price, currency)}`}
            </span>
            <span className="xsmall muted">{c.note}</span>
            <span className="xsmall muted num" style={{ textAlign: 'right' }}>
              {c.diff_pct === null ? '' : `${c.diff_pct.toFixed(2)}% apart`}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
